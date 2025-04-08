import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { searchYachts } from "../app/utils/api";
import { useAuth } from "../app/context/AuthContext";
import { CLIENT_ID, REDIRECT_URI, ENDPOINTS, SCOPES } from "../constants/oauth";
import { generateRandomString, generateCodeChallenge } from "../utils/pkce";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";

interface Yacht {
  id: string;
  name: string;
  length: number;
  builder: string;
  year: number;
  image: string;
  previousNames: string[];
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const { accessToken, setAccessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  console.log("test javier accessToken", accessToken);

  const searchYachtsWithApi = useCallback(
    async (query: string, pageNum: number = 0) => {
      if (!accessToken) {
        setError("Authentication required");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await searchYachts(query, accessToken, pageNum);

        const yachts = response.hits.hits.map((hit) => ({
          id: hit._source.id,
          name: hit._source.name,
          length: hit._source.length,
          builder: hit._source.builder,
          year: hit._source.build_year,
          image: hit._source.images[0]?.url || "https://placehold.co/600x400",
          previousNames: hit._source.previous_names,
        }));

        if (pageNum === 0) {
          setSearchResults(yachts);
        } else {
          setSearchResults((prev) => [...prev, ...yachts]);
        }

        setHasMore(response.hits.total.value > (pageNum + 1) * 25);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      setPage(0);
      if (text.length > 0) {
        searchYachtsWithApi(text, 0);
      } else {
        setSearchResults([]);
      }
    },
    [searchYachtsWithApi]
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && searchQuery.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      searchYachtsWithApi(searchQuery, nextPage);
    }
  }, [isLoading, hasMore, page, searchQuery, searchYachtsWithApi]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    searchYachtsWithApi(searchQuery, 0).finally(() => {
      setRefreshing(false);
    });
  }, [searchQuery, searchYachtsWithApi]);

  const renderYachtItem = useCallback(
    ({ item }: { item: Yacht }) => (
      <TouchableOpacity style={styles.yachtCard}>
        <Image source={{ uri: item.image }} style={styles.yachtImage} />
        <View style={styles.yachtInfo}>
          <Text style={styles.yachtName}>{item.name}</Text>
          <Text style={styles.yachtDetails}>
            {item.length}m • {item.builder} • {item.year}
          </Text>
          {item.previousNames.length > 0 && (
            <Text style={styles.previousNames}>
              Previously: {item.previousNames.join(", ")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    []
  );

  const renderFooter = useCallback(() => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }, [isLoading]);

  const handleLogin = async () => {
    console.log(
      "handleLogin",
      CLIENT_ID,
      REDIRECT_URI,
      ENDPOINTS.authorizationEndpoint,
      ENDPOINTS.tokenEndpoint,
      SCOPES
    );
    try {
      setIsLoading(true);

      if (
        !CLIENT_ID ||
        !REDIRECT_URI ||
        !ENDPOINTS.authorizationEndpoint ||
        !ENDPOINTS.tokenEndpoint ||
        !SCOPES
      ) {
        throw new Error("Missing required OAuth configuration");
      }

      // Generate PKCE parameters
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store code verifier for later use
      await SecureStore.setItemAsync("code_verifier", codeVerifier);

      // Construct authorization URL
      const authUrl = new URL(ENDPOINTS.authorizationEndpoint);
      authUrl.searchParams.append("client_id", CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("code_challenge", codeChallenge);
      authUrl.searchParams.append("code_challenge_method", "S256");
      authUrl.searchParams.append("scope", SCOPES.join(" "));

      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        REDIRECT_URI
      );

      if (result.type === "success") {
        const { url } = result;
        const code = new URL(url).searchParams.get("code");

        if (code) {
          // Exchange code for token
          const tokenResponse = await fetch(
            `${ENDPOINTS.tokenEndpoint}?grant_type=authorization_code&client_id=${CLIENT_ID}&code=${code}&redirect_uri=${REDIRECT_URI}&code_verifier=${codeVerifier}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          const tokenData = await tokenResponse.json();

          if (tokenData.access_token) {
            // Store tokens securely
            await SecureStore.setItemAsync(
              "access_token",
              tokenData.access_token
            );
            if (tokenData.refresh_token) {
              await SecureStore.setItemAsync(
                "refresh_token",
                tokenData.refresh_token
              );
            }
            // Update auth context
            setAccessToken(tokenData.access_token);
          } else {
            Alert.alert(
              "Error",
              `Failed to get access token: ${JSON.stringify(tokenData)}`
            );
          }
        } else {
          Alert.alert("Error", "No authorization code received");
        }
      } else {
        Alert.alert("Error", `Authentication failed: ${result.type}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        `Failed to login: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Welcome to SuperYacht Times</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? "Logging in..." : "Login with SuperYacht Times"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SuperYacht Times</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, builder, or year..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery("");
              setSearchResults([]);
              setError(null);
            }}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={searchResults}
        renderItem={renderYachtItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsContainer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <Text style={styles.noResults}>
              {isLoading ? "Searching..." : "No yachts found"}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  resultsContainer: {
    padding: 20,
  },
  yachtCard: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
  },
  yachtImage: {
    width: 100,
    height: 100,
  },
  yachtInfo: {
    flex: 1,
    padding: 12,
  },
  yachtName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  yachtDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  previousNames: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  noResults: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: "#ffebee",
    margin: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#c62828",
    textAlign: "center",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

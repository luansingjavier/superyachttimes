import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./context/AuthContext";
import { searchYachts } from "../app/utils/api";

interface SearchResult {
  id: string;
  name: string;
  previous_names: string[];
  build_year: number;
  length: number;
  builder: string;
  images: { url: string }[];
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const handleSearch = useCallback(
    async (text: string) => {
      setSearchQuery(text);
      setError(null);

      if (!accessToken) {
        setError("Authentication required");
        return;
      }

      if (text.length === 0) {
        setSearchResults([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await searchYachts(text, accessToken);

        console.log(
          "test javier response 3",
          response?.hits?.hits.map((hit) => hit?._source)
        );
        setSearchResults(response?.hits?.hits.map((hit) => hit?._source));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => {
        // TODO: Navigate to the detailed view of the item
        console.log("Pressed item:", item);
      }}
    >
      {item.images && item.images[0] && (
        <Image
          source={{ uri: item.images[0].url }}
          style={styles.yachtImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.yachtInfo}>
        <Text style={styles.yachtName}>{item.name}</Text>
        <View style={styles.yachtDetails}>
          <Text style={styles.yachtDetail}>{item.builder}</Text>
          <Text style={styles.yachtDetail}>{item.build_year}</Text>
          <Text style={styles.yachtDetail}>{item.length}m</Text>
        </View>
        {item.previous_names && item.previous_names.length > 0 && (
          <Text style={styles.previousNames}>
            Previously: {item.previous_names.join(", ")}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search yachts..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={searchResults}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.resultsList}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0
                  ? "No results found"
                  : "Start typing to search"}
              </Text>
            </View>
          )
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
  searchContainer: {
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
  },
  previousNames: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  details: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  yachtImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  yachtInfo: {
    flex: 1,
  },
  yachtName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  yachtDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  yachtDetail: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import AddPositionModal from "./AddPositionModal";

interface YachtDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  yacht: {
    id: string;
    name: string;
    previousNames: string[];
    buildYear: number;
    length: number;
    builder: string;
    image: string;
  };
  accessToken: string;
}

interface Position {
  id: string;
  date_time: string;
  lat: string;
  lon: string;
  notes: string;
}

export default function YachtDetailsModal({
  visible,
  onClose,
  yacht,
  accessToken,
}: YachtDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("map");
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPosition, setShowAddPosition] = useState(false);

  const fetchPositions = async () => {
    try {
      const response = await fetch(
        `https://api0.superyachtapi.com/api/positions?yacht_like_id=${yacht.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch positions");
      }

      const data = await response.json();
      setPositions(data);
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchPositions();
    }
  }, [visible, yacht.id]);

  const renderMap = () => (
    <View style={styles.mapContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : positions.length > 0 ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: parseFloat(positions[0].lat),
            longitude: parseFloat(positions[0].lon),
            latitudeDelta: 2,
            longitudeDelta: 2,
          }}
        >
          {positions.map((position) => (
            <Marker
              key={position.id}
              coordinate={{
                latitude: parseFloat(position.lat),
                longitude: parseFloat(position.lon),
              }}
              title={new Date(position.date_time).toLocaleDateString()}
              description={position.notes}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No positions available</Text>
        </View>
      )}
    </View>
  );

  const renderLocationsList = () => (
    <ScrollView style={styles.locationsList}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : positions.length > 0 ? (
        positions.map((position) => (
          <View key={position.id} style={styles.locationItem}>
            <Ionicons name="location" size={24} color="#007AFF" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>
                {new Date(position.date_time).toLocaleDateString()}
              </Text>
              <Text style={styles.locationDate}>{position.notes}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No positions available</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderYachtDetails = () => (
    <ScrollView style={styles.detailsContainer}>
      <Image source={{ uri: yacht.image }} style={styles.yachtImage} />
      <View style={styles.detailsContent}>
        <Text style={styles.yachtName}>{yacht.name}</Text>

        {yacht.previousNames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Previous Names</Text>
            {yacht.previousNames.map((name, index) => (
              <Text key={index} style={styles.previousName}>
                {name}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Length:</Text>
            <Text style={styles.specValue}>{yacht.length}m</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Builder:</Text>
            <Text style={styles.specValue}>{yacht.builder}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Build Year:</Text>
            <Text style={styles.specValue}>{yacht.buildYear}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{yacht.name}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddPosition(true)}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "map" && styles.activeTab]}
              onPress={() => setActiveTab("map")}
            >
              <Ionicons
                name="map"
                size={24}
                color={activeTab === "map" ? "#007AFF" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "map" && styles.activeTabText,
                ]}
              >
                Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "locations" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("locations")}
            >
              <Ionicons
                name="list"
                size={24}
                color={activeTab === "locations" ? "#007AFF" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "locations" && styles.activeTabText,
                ]}
              >
                Locations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "details" && styles.activeTab]}
              onPress={() => setActiveTab("details")}
            >
              <Ionicons
                name="information-circle"
                size={24}
                color={activeTab === "details" ? "#007AFF" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "details" && styles.activeTabText,
                ]}
              >
                Details
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {activeTab === "map" && renderMap()}
            {activeTab === "locations" && renderLocationsList()}
            {activeTab === "details" && renderYachtDetails()}
          </View>
        </View>
      </Modal>

      <AddPositionModal
        visible={showAddPosition}
        onClose={() => setShowAddPosition(false)}
        yachtId={yacht.id}
        accessToken={accessToken}
        onPositionAdded={fetchPositions}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    marginRight: 16,
  },
  addButton: {
    marginLeft: "auto",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  tabText: {
    marginLeft: 8,
    color: "#666",
  },
  activeTabText: {
    color: "#007AFF",
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: "100%",
  },
  locationsList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  locationInfo: {
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "500",
  },
  locationDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  detailsContainer: {
    flex: 1,
  },
  yachtImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  detailsContent: {
    padding: 16,
  },
  yachtName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  previousName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  specRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  specLabel: {
    fontSize: 16,
    color: "#666",
    width: 100,
  },
  specValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loader: {
    marginTop: 20,
  },
});

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";

interface AddPositionModalProps {
  visible: boolean;
  onClose: () => void;
  yachtId: string;
  accessToken: string;
  onPositionAdded: () => void;
}

export default function AddPositionModal({
  visible,
  onClose,
  yachtId,
  accessToken,
  onPositionAdded,
}: AddPositionModalProps) {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to add positions."
        );
        return;
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (error) {
        console.error("Error getting location:", error);
        Alert.alert(
          "Error",
          "Could not get current location. Please try again."
        );
      }
    })();
  }, []);

  const handleMapPress = (e: any) => {
    const { coordinate } = e.nativeEvent;
    setLocation(coordinate);
  };

  const handleAddPosition = async () => {
    if (!location) {
      Alert.alert("Error", "Please select a location on the map");
      return;
    }

    if (note.length > 140) {
      Alert.alert("Error", "Note must be 140 characters or less");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api0.superyachtapi.com/api/positions?yacht_like_id=${yachtId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            yacht_like_id: yachtId,
            date_time: date.toISOString(),
            lat: location.latitude.toString(),
            lon: location.longitude.toString(),
            notes: note,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add position");
      }

      Alert.alert("Success", "Position added successfully");
      onPositionAdded();
      onClose();
    } catch (error) {
      console.error("Error adding position:", error);
      Alert.alert("Error", "Failed to add position. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <Text style={styles.headerTitle}>Add Position</Text>
        </View>

        <View style={styles.mapContainer}>
          {location && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onLongPress={handleMapPress}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
              />
            </MapView>
          )}
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={24} color="#007AFF" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (max 140 characters)"
            value={note}
            onChangeText={setNote}
            maxLength={140}
            multiline
          />

          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.disabledButton]}
            onPress={handleAddPosition}
            disabled={isLoading}
          >
            <Text style={styles.addButtonText}>
              {isLoading ? "Adding..." : "Add Position"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  form: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 16,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

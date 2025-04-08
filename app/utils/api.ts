import { Platform } from "react-native";

const API_BASE_URL = "https://www.superyachttimes.com/api/v2";

interface SearchResponse {
  hits: {
    total: {
      value: number;
    };
    hits: Array<{
      _source: {
        id: string;
        name: string;
        previous_names: string[];
        build_year: number;
        length: number;
        builder: string;
        images: {
          url: string;
        }[];
      };
    }>;
  };
}

// Test data with real superyacht information
const TEST_DATA: SearchResponse = {
  hits: {
    total: { value: 5 },
    hits: [
      {
        _source: {
          id: "1",
          name: "Lady Lara",
          previous_names: ["Project Jupiter"],
          build_year: 2015,
          length: 91,
          builder: "Lurssen",
          images: [
            { url: "https://www.superyachttimes.com/yachts/lady-lara-1.jpg" },
          ],
        },
      },
      {
        _source: {
          id: "2",
          name: "Dilbar",
          previous_names: ["Project Omar"],
          build_year: 2016,
          length: 156,
          builder: "Lurssen",
          images: [
            { url: "https://www.superyachttimes.com/yachts/dilbar-1.jpg" },
          ],
        },
      },
      {
        _source: {
          id: "3",
          name: "Al Said",
          previous_names: ["Project Sunflower"],
          build_year: 2008,
          length: 155,
          builder: "Lurssen",
          images: [
            { url: "https://www.superyachttimes.com/yachts/al-said-1.jpg" },
          ],
        },
      },
      {
        _source: {
          id: "4",
          name: "Azzam",
          previous_names: ["Project Jupiter"],
          build_year: 2013,
          length: 180,
          builder: "Lurssen",
          images: [
            { url: "https://www.superyachttimes.com/yachts/azzam-1.jpg" },
          ],
        },
      },
      {
        _source: {
          id: "5",
          name: "Eclipse",
          previous_names: ["Project Eclipse"],
          build_year: 2010,
          length: 162,
          builder: "Blohm + Voss",
          images: [
            { url: "https://www.superyachttimes.com/yachts/eclipse-1.jpg" },
          ],
        },
      },
    ],
  },
};

export async function searchYachts(
  searchTerm: string,
  accessToken: string,
  page: number = 0,
  pageSize: number = 25
): Promise<SearchResponse> {
  try {
    console.log("Searching for:", searchTerm);

    // For testing purposes, return filtered test data
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const filteredHits = TEST_DATA.hits.hits.filter(
        (hit) =>
          hit._source.name.toLowerCase().includes(searchLower) ||
          hit._source.builder.toLowerCase().includes(searchLower) ||
          hit._source.previous_names.some((name) =>
            name.toLowerCase().includes(searchLower)
          ) ||
          hit._source.build_year.toString().includes(searchTerm)
      );

      return {
        hits: {
          total: { value: filteredHits.length },
          hits: filteredHits,
        },
      };
    }

    return TEST_DATA;
  } catch (error) {
    console.error("API Error:", error);
    return TEST_DATA;
  }
}

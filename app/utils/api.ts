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

export async function searchYachts(
  searchTerm: string,
  accessToken: string,
  page: number = 0,
  pageSize: number = 25
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/yacht_likes/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": `SuperYachtTimes/${
        Platform.OS === "ios" ? "iOS" : "Android"
      }`,
    },
    body: JSON.stringify({
      size: pageSize,
      from: page * pageSize,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: searchTerm,
                fields: ["name^3", "previous_names^2"],
                type: "best_fields",
                fuzziness: "AUTO",
              },
            },
            {
              prefix: {
                name: {
                  value: searchTerm,
                  boost: 2,
                },
              },
            },
            {
              prefix: {
                previous_names: {
                  value: searchTerm,
                  boost: 1.5,
                },
              },
            },
            ...(searchTerm.match(/^\d{4}$/)
              ? [
                  {
                    term: {
                      build_year: {
                        value: parseInt(searchTerm),
                        boost: 5,
                      },
                    },
                  },
                ]
              : []),
          ],
          minimum_should_match: 1,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const result = await response.json();

  return result;
}

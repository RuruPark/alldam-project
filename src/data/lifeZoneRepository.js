import { mockLifeZones } from "./mockLifeZones.js";

// UI는 이 저장소 함수를 통해 생활권 데이터를 받습니다.
// 현재는 시연용 mock 데이터이며, 실제 공공데이터 전처리 결과도 같은 LifeZone 배열로 교체할 수 있습니다.
export function getLifeZoneDataset() {
  return {
    sourceType: "demo",
    sourceLabel: "시연용 mock 데이터",
    lifeZones: mockLifeZones
  };
}

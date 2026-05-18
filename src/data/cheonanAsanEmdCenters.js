const NO_DISTRICT = "해당 없음";

// 시연용 읍면동 중심좌표 데이터입니다.
// 실제 서비스에서는 행정구역 polygon 대표점 또는 공공데이터 전처리 좌표로 교체합니다.
export const cheonanAsanEmdCenters = [
  {
    emdCode: "44133101",
    city: "천안시",
    district: "서북구",
    emdName: "불당동",
    lat: 36.8154,
    lng: 127.1085
  },
  {
    emdCode: "44133102",
    city: "천안시",
    district: "서북구",
    emdName: "쌍용동",
    lat: 36.7946,
    lng: 127.1224
  },
  {
    emdCode: "44133103",
    city: "천안시",
    district: "서북구",
    emdName: "성정동",
    lat: 36.8127,
    lng: 127.1375
  },
  {
    emdCode: "44131101",
    city: "천안시",
    district: "동남구",
    emdName: "신부동",
    lat: 36.8231,
    lng: 127.1554
  },
  {
    emdCode: "44200101",
    city: "아산시",
    district: NO_DISTRICT,
    emdName: "온양1동",
    lat: 36.7803,
    lng: 126.9996
  },
  {
    emdCode: "44200250",
    city: "아산시",
    district: NO_DISTRICT,
    emdName: "배방읍",
    lat: 36.7739,
    lng: 127.0628
  },
  {
    emdCode: "44200330",
    city: "아산시",
    district: NO_DISTRICT,
    emdName: "탕정면",
    lat: 36.7982,
    lng: 127.0852
  },
  {
    emdCode: "44200350",
    city: "아산시",
    district: NO_DISTRICT,
    emdName: "둔포면",
    lat: 36.9294,
    lng: 127.0382
  }
];

export function getCities() {
  return [...new Set(cheonanAsanEmdCenters.map((center) => center.city))];
}

export function getDistrictsByCity(city) {
  return [
    ...new Set(
      cheonanAsanEmdCenters
        .filter((center) => center.city === city)
        .map((center) => center.district || NO_DISTRICT)
    )
  ];
}

export function getEmdsByCityAndDistrict(city, district) {
  const selectedDistrict = district || NO_DISTRICT;

  return cheonanAsanEmdCenters.filter((center) => {
    if (center.city !== city) return false;
    if (center.city === "아산시") return true;
    return center.district === selectedDistrict;
  });
}

export function findEmdCenter(selection) {
  if (typeof selection === "string") {
    return findEmdCenterByCode(selection);
  }

  const { city, district, emdName } = selection ?? {};
  if (!city || !emdName) return null;

  return cheonanAsanEmdCenters.find((center) => (
    center.city === city &&
    center.emdName === emdName &&
    (!district || center.district === district)
  )) ?? null;
}

export function findEmdCenterByCode(emdCode) {
  return cheonanAsanEmdCenters.find((center) => center.emdCode === emdCode) ?? null;
}

export function getWorkplaceCities() {
  return getCities();
}

export function getEmdsBySelection(city, district) {
  return getEmdsByCityAndDistrict(city, district);
}

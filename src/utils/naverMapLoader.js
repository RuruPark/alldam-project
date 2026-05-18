const NAVER_MAP_SCRIPT_ID = "naver-map-sdk";
let naverMapScriptPromise = null;

export function loadNaverMapScript(clientId) {
  if (!clientId) {
    return Promise.reject(new Error("Naver Map client ID is required."));
  }

  if (window.naver?.maps) {
    return Promise.resolve(window.naver);
  }

  if (naverMapScriptPromise) {
    return naverMapScriptPromise;
  }

  const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID);
  if (existingScript) {
    naverMapScriptPromise = waitForExistingScript(existingScript);
    return naverMapScriptPromise;
  }

  naverMapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = NAVER_MAP_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
    script.dataset.mapProvider = "naver";

    script.addEventListener("load", () => {
      if (window.naver?.maps) {
        resolve(window.naver);
        return;
      }

      reject(new Error("Naver Map SDK loaded without maps namespace."));
    });
    script.addEventListener("error", () => {
      naverMapScriptPromise = null;
      reject(new Error("Failed to load Naver Map SDK."));
    });

    document.head.appendChild(script);
  });

  return naverMapScriptPromise;
}

function waitForExistingScript(script) {
  return new Promise((resolve, reject) => {
    if (window.naver?.maps) {
      resolve(window.naver);
      return;
    }

    script.addEventListener("load", () => {
      if (window.naver?.maps) {
        resolve(window.naver);
        return;
      }

      reject(new Error("Existing Naver Map SDK loaded without maps namespace."));
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load existing Naver Map SDK.")), {
      once: true
    });
  });
}

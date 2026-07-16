export const PET_STORAGE_KEY = "twentyeight:pet-enabled";
export const PET_PERSONA_KEY = "twentyeight:pet-persona";
export const PET_PREFERENCE_EVENT = "twentyeight:pet-preference-changed";

export type PetPersona = "beacon" | "orb" | "droid" | "sentinel";

export function readPetPreference() {
  return window.localStorage.getItem(PET_STORAGE_KEY) !== "false";
}

export function savePetPreference(enabled: boolean) {
  window.localStorage.setItem(PET_STORAGE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent(PET_PREFERENCE_EVENT));
}

export function readPetPersona(): PetPersona {
  const value = window.localStorage.getItem(PET_PERSONA_KEY);
  return value === "beacon" || value === "droid" || value === "sentinel"
    ? value
    : "orb";
}

export function savePetPersona(persona: PetPersona) {
  window.localStorage.setItem(PET_PERSONA_KEY, persona);
  window.dispatchEvent(new CustomEvent(PET_PREFERENCE_EVENT));
}

export function subscribeToPetPreference(onChange: () => void) {
  window.addEventListener(PET_PREFERENCE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PET_PREFERENCE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const getServerPetPreference = () => true;
export const getServerPetPersona = (): PetPersona => "orb";

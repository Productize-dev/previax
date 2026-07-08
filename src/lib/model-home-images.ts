/** Placeholder Lennar renders for model homes until per-model images are provided. */
export const EXAMPLE_MODEL_HOME_IMAGES = [
  "https://cdn.lennar.com/api/images/contentassets/58b003c920e142d5bfeb2ccd0edd12ae/crs_1591_waterwaycommons_rend_savannah_a6.jpg?d=20250722T220657&w=1850",
  "https://cdn.lennar.com/api/images/contentassets/78af654b4d294734b20167549e07eb8a/crs_1835_waterwaycommons_rend_wilmington_a6.jpg?d=20250721T163959&w=1850",
  "https://cdn.lennar.com/api/images/contentassets/597d019f40204ffe945bb519bdb1ea1e/copy-of-crs_2443_rend_kensington_group4_a6.jpg?d=20250220T224803&w=1850",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Stable pseudo-random image per model name (same model always gets the same image). */
export function pickExampleModelHomeImage(seed: string): string {
  const index = hashString(seed) % EXAMPLE_MODEL_HOME_IMAGES.length;
  return EXAMPLE_MODEL_HOME_IMAGES[index];
}

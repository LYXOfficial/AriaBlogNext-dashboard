import { createDarkTheme, createLightTheme } from '@fluentui/react-components';
import type { BrandVariants, Theme } from '@fluentui/react-components';
const myTheme: BrandVariants={ 
  10: "#000000",
  20: "#200E13",
  30: "#371520",
  40: "#4F1B2E",
  50: "#66223B",
  60: "#7E2A4A",
  70: "#953459",
  80: "#AC4068",
  90: "#C14E78",
  100: "#D65C88",
  110: "#EA6D98",
  120: "#FC7EA9",
  130: "#FF9AB9",
  140: "#FFB5CA",
  150: "#FFCFDC",
  160: "#FFE7EE"
};
export const lightTheme:Theme={
  ...createLightTheme(myTheme),
  fontWeightRegular:600,
  fontFamilyBase:"Noto Serif SC",
  fontWeightSemibold:800,
  fontWeightMedium:700,
  fontWeightBold:900,
};

export const darkTheme:Theme={
  ...createDarkTheme(myTheme),
  fontWeightRegular:600,
  fontFamilyBase:"Noto Serif SC",
  fontWeightSemibold:800,
  fontWeightMedium:700,
  fontWeightBold:900
};
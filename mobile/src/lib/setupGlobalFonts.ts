import { StyleSheet, Text, TextInput } from "react-native";
import { fonts } from "@/constants/theme";

let applied = false;

type ComponentWithDefaultProps = {
  defaultProps?: { style?: object };
};

/** Apply Onest as the default body face for unstyled Text / TextInput. */
export function setupGlobalFonts() {
  if (applied) return;
  applied = true;

  const bodyStyle = { fontFamily: fonts.body };

  const textComponent = Text as unknown as ComponentWithDefaultProps;
  const textDefaults = textComponent.defaultProps ?? {};
  textComponent.defaultProps = {
    ...textDefaults,
    style: StyleSheet.flatten([textDefaults.style, bodyStyle]),
  };

  const inputComponent = TextInput as unknown as ComponentWithDefaultProps;
  const inputDefaults = inputComponent.defaultProps ?? {};
  inputComponent.defaultProps = {
    ...inputDefaults,
    style: StyleSheet.flatten([inputDefaults.style, bodyStyle]),
  };
}

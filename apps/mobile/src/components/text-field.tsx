import { forwardRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, style, ...props },
  ref,
) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor="#8e8e93"
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export const PasswordField = forwardRef<TextInput, TextFieldProps>(function PasswordField(
  { label, error, style, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          ref={ref}
          style={[styles.input, styles.passwordInput, error ? styles.inputError : null, style]}
          placeholderTextColor="#8e8e93"
          secureTextEntry={!visible}
          {...props}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setVisible((v) => !v)}
          accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {visible ? <EyeOff size={20} color="#8e8e93" /> : <Eye size={20} color="#8e8e93" />}
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500", color: "#1d1d1f" },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1d1d1f",
  },
  inputError: { borderColor: "#d92d20" },
  passwordRow: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 44 },
  eyeButton: {
    position: "absolute",
    right: 12,
    height: 48,
    justifyContent: "center",
  },
  error: { fontSize: 13, color: "#d92d20" },
});

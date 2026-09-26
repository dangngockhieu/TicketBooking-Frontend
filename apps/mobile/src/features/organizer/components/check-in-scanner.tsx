import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { ApiError, formatTime } from "@ticketbooking/shared";
import { useCheckIn } from "@/features/organizer/hooks";

const DUPLICATE_DEBOUNCE_MS = 3000;

interface CheckInResultView {
  ok: boolean;
  title: string;
  detail: string;
}

export function CheckInScanner({ eventId }: { eventId: string }) {
  const [permission, requestPermission] = useCameraPermissions();
  const checkIn = useCheckIn();
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);

  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<CheckInResultView | null>(null);
  const [history, setHistory] = useState<{ valid: number; rejected: number }>({
    valid: 0,
    rejected: 0,
  });

  async function processCode(code: string) {
    const now = Date.now();
    if (
      lastCodeRef.current &&
      lastCodeRef.current.code === code &&
      now - lastCodeRef.current.at < DUPLICATE_DEBOUNCE_MS
    ) {
      return; // bỏ qua mã vừa quét lặp lại trong 3s
    }
    lastCodeRef.current = { code, at: now };

    try {
      const res = await checkIn.mutateAsync({ qrCodeData: code, eventId });
      setResult({ ok: true, title: "HỢP LỆ", detail: `${res.ticketClass} · ${res.customerName}` });
      setHistory((h) => ({ ...h, valid: h.valid + 1 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => setResult(null), 2000);
    } catch (err) {
      let detail = "Không thể check-in vé này.";
      if (err instanceof ApiError) {
        if (err.httpStatus === 409 && err.message.toLowerCase().includes("đã được check-in")) {
          detail = `ĐÃ CHECK-IN lúc ${formatTime(new Date().toISOString())}`;
        } else {
          detail = err.message;
        }
      }
      setResult({ ok: false, title: "TỪ CHỐI", detail });
      setHistory((h) => ({ ...h, rejected: h.rejected + 1 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }

  function handleManualSubmit() {
    if (manualCode.trim()) {
      processCode(manualCode.trim());
      setManualCode("");
    }
  }

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.meta}>Cần quyền camera để quét mã QR check-in vé.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => requestPermission()}>
          <Text style={styles.permissionButtonText}>Cấp quyền camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={(scan) => processCode(scan.data)}
        />
        {result ? (
          <View style={[styles.resultOverlay, result.ok ? styles.resultOk : styles.resultFail]}>
            {result.ok ? (
              <CheckCircle2 size={48} color="#fff" />
            ) : (
              <XCircle size={48} color="#fff" />
            )}
            <Text style={styles.resultTitle}>{result.title}</Text>
            <Text style={styles.resultDetail}>{result.detail}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.manualRow}>
        <TextInput
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="Nhập mã vé thủ công"
          style={styles.manualInput}
          onSubmitEditing={handleManualSubmit}
        />
        <TouchableOpacity style={styles.manualButton} onPress={handleManualSubmit}>
          <Text style={styles.manualButtonText}>Kiểm tra</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.meta}>
        Lịch sử phiên: <Text style={styles.validCount}>{history.valid} hợp lệ</Text> ·{" "}
        <Text style={styles.rejectedCount}>{history.rejected} từ chối</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  cameraWrapper: {
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: { flex: 1 },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resultOk: { backgroundColor: "rgba(5, 150, 105, 0.92)" },
  resultFail: { backgroundColor: "rgba(217, 45, 32, 0.92)" },
  resultTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  resultDetail: { fontSize: 13, color: "#fff", textAlign: "center", paddingHorizontal: 16 },
  manualRow: { flexDirection: "row", gap: 8 },
  manualInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  manualButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  manualButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 13, color: "#6b6b70" },
  validCount: { fontWeight: "600", color: "#059669" },
  rejectedCount: { fontWeight: "600", color: "#d92d20" },
  permissionContainer: { alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  permissionButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});

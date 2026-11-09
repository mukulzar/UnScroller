import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Modal,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Screen = 'Dashboard' | 'Permission' | 'Configure' | 'Mindful pause';
type InterceptionAction = 'home' | 'app' | 'pause';
type Duration = '5 Mins' | '15 Mins' | '1 Hour';
type NativeSettings = {
  enabled: boolean;
  youtubeEnabled: boolean;
  instagramEnabled: boolean;
  action: InterceptionAction;
  redirectPackage: string;
  pauseDurationMinutes: number;
  pausedUntil: number;
  frictionEnabled: boolean;
  hasFrictionPin: boolean;
  blocksToday: number;
  minutesSavedToday: number;
  accessibilityEnabled: boolean;
  mindfulPausePending: boolean;
};
type InstalledApp = { packageName: string; label: string };
type SettingsPatch = Partial<
  Omit<
    NativeSettings,
    'hasFrictionPin' | 'accessibilityEnabled' | 'mindfulPausePending'
  >
>;

const nativeModule = NativeModules.ReelBreakModule;

const mint = '#8EF0C6';

function Toggle({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#344142', true: '#427c68' }}
      thumbColor={value ? mint : '#a8b4b1'}
    />
  );
}

function TabButton({
  label,
  selected,
  onPress,
  rail = false,
}: {
  label: Screen;
  selected: boolean;
  onPress: () => void;
  rail?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        rail && styles.railTab,
        selected && styles.selectedTab,
        pressed && styles.pressedTab,
      ]}
    >
      <Text style={[styles.tabText, selected && styles.selectedTabText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {detail ? <Text style={styles.mutedSmall}>{detail}</Text> : null}
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const useNavigationRail = width >= 600;
  const [screen, setScreen] = useState<Screen>('Permission');
  const [settings, setSettings] = useState<NativeSettings>({
    enabled: false,
    youtubeEnabled: true,
    instagramEnabled: true,
    action: 'home',
    redirectPackage: '',
    pauseDurationMinutes: 15,
    pausedUntil: 0,
    frictionEnabled: false,
    hasFrictionPin: false,
    blocksToday: 0,
    minutesSavedToday: 0,
    accessibilityEnabled: false,
    mindfulPausePending: false,
  });
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [appPickerVisible, setAppPickerVisible] = useState(false);
  const [pinMode, setPinMode] = useState<'setup' | 'verify' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmation, setPinConfirmation] = useState('');
  const [pendingPatch, setPendingPatch] = useState<SettingsPatch | null>(null);
  const [breathingSeconds, setBreathingSeconds] = useState(5);
  const [now, setNow] = useState(Date.now());

  const refreshSettings = useCallback(async () => {
    if (!nativeModule) {
      setLoading(false);
      return;
    }
    try {
      const next = (await nativeModule.getSettings()) as NativeSettings;
      setSettings(next);
      if (next.action === 'app') {
        setApps((await nativeModule.getLaunchableApps()) as InstalledApp[]);
      }
      if (next.mindfulPausePending) {
        setScreen('Mindful pause');
        await nativeModule.updateSettings({ mindfulPausePending: false });
      } else if (next.accessibilityEnabled) {
        setScreen(current =>
          current === 'Permission' ? 'Dashboard' : current,
        );
      } else if (!next.accessibilityEnabled) {
        setScreen('Permission');
      }
    } catch (error) {
      Alert.alert('Unable to load settings', String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refreshSettings();
    });
    return () => subscription.remove();
  }, [refreshSettings]);

  useEffect(() => {
    if (screen !== 'Mindful pause') {
      setBreathingSeconds(5);
      return;
    }
    const interval = setInterval(() => {
      setBreathingSeconds(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [screen]);

  useEffect(() => {
    if (settings.pausedUntil <= Date.now()) return undefined;
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (settings.pausedUntil <= currentTime) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.pausedUntil]);

  const saveSettings = useCallback(
    async (patch: SettingsPatch) => {
      if (!nativeModule) {
        Alert.alert(
          'Android required',
          'App detection and blocking are available on Android.',
        );
        return;
      }
      try {
        await nativeModule.updateSettings(patch);
        setSettings(current => ({ ...current, ...patch }));
      } catch (error) {
        Alert.alert('Unable to save settings', String(error));
        await refreshSettings();
      }
    },
    [refreshSettings],
  );

  const requestPin = (patch: SettingsPatch) => {
    setPendingPatch(patch);
    setPinInput('');
    setPinConfirmation('');
    setPinMode(settings.hasFrictionPin ? 'verify' : 'setup');
  };

  const changeSetting = (key: keyof SettingsPatch, value: boolean) => {
    if (
      !value &&
      settings.frictionEnabled &&
      settings.hasFrictionPin &&
      key !== 'frictionEnabled'
    ) {
      requestPin({ [key]: value });
      return;
    }
    if (key === 'frictionEnabled' && value && !settings.hasFrictionPin) {
      requestPin({ frictionEnabled: true });
      return;
    }
    if (key === 'frictionEnabled' && !value && settings.hasFrictionPin) {
      requestPin({ frictionEnabled: false });
      return;
    }
    saveSettings({ [key]: value });
  };

  const submitPin = async () => {
    if (pinMode === 'setup') {
      if (!/^\d{4,8}$/.test(pinInput)) {
        Alert.alert('Choose a 4–8 digit code');
        return;
      }
      if (pinInput !== pinConfirmation) {
        Alert.alert("Codes don't match", 'Enter the same code in both fields.');
        return;
      }
      try {
        await nativeModule.setFrictionPin(pinInput);
        setSettings(current => ({ ...current, hasFrictionPin: true }));
        if (pendingPatch) await saveSettings(pendingPatch);
        setPinMode(null);
        setPendingPatch(null);
      } catch (error) {
        Alert.alert('Unable to save code', String(error));
      }
      return;
    }
    try {
      const valid = await nativeModule.verifyFrictionPin(pinInput);
      if (!valid) {
        Alert.alert('Incorrect code', 'Try entering your friction code again.');
        return;
      }
      if (pendingPatch) await saveSettings(pendingPatch);
      setPinMode(null);
      setPendingPatch(null);
    } catch (error) {
      Alert.alert('Unable to verify code', String(error));
    }
  };

  const loadApps = async () => {
    try {
      const installed =
        (await nativeModule.getLaunchableApps()) as InstalledApp[];
      setApps(installed);
      setAppPickerVisible(true);
    } catch (error) {
      Alert.alert('Unable to load apps', String(error));
    }
  };

  const requestAccessibility = async () => {
    try {
      await nativeModule.openAccessibilitySettings();
    } catch (error) {
      Alert.alert('Unable to open Accessibility settings', String(error));
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.unsupported}>
          <View style={styles.brandLockup}>
            <Image
              source={require('./src/assets/unscroller-mark.png')}
              style={styles.logoMark}
            />
            <Text style={styles.brand}>UnScroller</Text>
          </View>
          <Text style={styles.pageTitle}>Android required</Text>
          <Text style={styles.bodyText}>
            Shorts and Reels detection is currently available on Android only.
            iOS does not allow apps to monitor or close other apps.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.container,
          useNavigationRail && styles.expandedContainer,
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require('./src/assets/unscroller-mark.png')}
            style={styles.logoMark}
          />
          <Text style={styles.brand}>UnScroller</Text>
        </View>

        <View
          style={[
            styles.screenBody,
            useNavigationRail && styles.expandedScreenBody,
          ]}
        >
          {useNavigationRail ? (
            <View style={styles.navigationRail} accessibilityRole="tablist">
              {(['Dashboard', 'Permission', 'Configure'] as const).map(item => (
                <TabButton
                  key={item}
                  label={item}
                  selected={screen === item}
                  onPress={() => setScreen(item)}
                  rail
                />
              ))}
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={mint}
                accessibilityLabel="Loading settings"
              />
            </View>
          ) : (
            <ScrollView
              style={styles.pageContent}
              contentContainerStyle={[
                styles.content,
                useNavigationRail && styles.wideContent,
              ]}
              showsVerticalScrollIndicator={false}
            >
              {screen === 'Dashboard' ? (
                <>
                  <Text style={styles.pageTitle}>Overview</Text>
                  <View
                    style={[styles.card, settings.enabled && styles.activeCard]}
                  >
                    <View style={styles.row}>
                      <View style={styles.flex}>
                        <Text style={styles.cardTitle}>
                          {settings.pausedUntil > now
                            ? 'Protection paused'
                            : settings.enabled
                            ? 'You’re protected'
                            : 'Protection off'}
                        </Text>
                      </View>
                      <Toggle
                        value={settings.enabled}
                        onValueChange={enabled => {
                          if (enabled && !settings.accessibilityEnabled) {
                            setScreen('Permission');
                            Alert.alert(
                              'Accessibility permission required',
                              'Enable UnScroller in Android Accessibility settings before turning on protection.',
                            );
                            return;
                          }
                          changeSetting('enabled', enabled);
                        }}
                        label="Toggle master blocker"
                      />
                    </View>
                    <Text style={styles.statusText}>
                      {!settings.accessibilityEnabled
                        ? 'Accessibility permission is required'
                        : settings.pausedUntil > now
                        ? 'Paused until your break ends'
                        : settings.enabled
                        ? 'Active — Watching for Shorts and Reels'
                        : 'Inactive — Blocking is paused'}
                    </Text>
                  </View>

                  <SectionTitle title="Feeds" detail="Choose what to block" />
                  <View style={styles.targetList}>
                    <View style={styles.targetRow}>
                      <View style={styles.flex}>
                        <Text style={styles.targetTitle}>YouTube Shorts</Text>
                        <Text style={styles.mutedSmall}>
                          {settings.youtubeEnabled
                            ? 'Blocking enabled'
                            : 'Not blocked'}
                        </Text>
                      </View>
                      <Toggle
                        value={settings.youtubeEnabled}
                        onValueChange={value =>
                          changeSetting('youtubeEnabled', value)
                        }
                        label="Toggle YouTube Shorts blocking"
                      />
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.targetRow}>
                      <View style={styles.flex}>
                        <Text style={styles.targetTitle}>Instagram Reels</Text>
                        <Text style={styles.mutedSmall}>
                          {settings.instagramEnabled
                            ? 'Blocking enabled'
                            : 'Not blocked'}
                        </Text>
                      </View>
                      <Toggle
                        value={settings.instagramEnabled}
                        onValueChange={value =>
                          changeSetting('instagramEnabled', value)
                        }
                        label="Toggle Instagram Reels blocking"
                      />
                    </View>
                  </View>

                  <View style={styles.impactRow}>
                    <Text style={styles.impactText}>
                      {settings.blocksToday}{' '}
                      {settings.blocksToday === 1 ? 'block' : 'blocks'} today
                    </Text>
                    <Text style={styles.impactText}>
                      About {settings.minutesSavedToday} min saved
                    </Text>
                  </View>
                </>
              ) : null}

              {screen === 'Permission' ? (
                <>
                  <Text style={styles.pageTitle}>Allow access</Text>
                  <View style={styles.permissionContent}>
                    <Text style={styles.cardTitle}>
                      Accessibility Permission:{' '}
                      {settings.accessibilityEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                    <Text style={styles.bodyText}>
                      UnScroller uses Android Accessibility to recognize Shorts
                      and Reels while either app is open. Detection stays on
                      this device.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => requestAccessibility()}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>
                        {settings.accessibilityEnabled
                          ? 'Accessibility Enabled'
                          : 'Open Accessibility Settings'}
                      </Text>
                    </Pressable>
                    <Text style={styles.statusText}>
                      {settings.accessibilityEnabled
                        ? 'Now turn on protection from the Dashboard.'
                        : 'Choose “UnScroller Shorts and Reels blocker” and enable the service.'}
                    </Text>
                  </View>
                </>
              ) : null}

              {screen === 'Configure' ? (
                <>
                  <Text style={styles.pageTitle}>Settings</Text>
                  <SectionTitle title="When a feed opens" />
                  <View style={styles.optionList}>
                    {(
                      [
                        ['home', 'Home screen', 'Close the feed immediately'],
                        ['app', 'Productive app', 'Open an app you choose'],
                        [
                          'pause',
                          'Mindful pause',
                          'Take a 5-second breathing reset',
                        ],
                      ] as const
                    ).map(([item, title, description]) => (
                      <Pressable
                        key={item}
                        accessibilityRole="radio"
                        accessibilityState={{
                          selected: settings.action === item,
                        }}
                        onPress={() => {
                          if (item === 'app' && !settings.redirectPackage) {
                            loadApps();
                            return;
                          }
                          saveSettings({ action: item });
                        }}
                        style={styles.optionRow}
                      >
                        <View style={styles.flex}>
                          <Text style={styles.targetTitle}>{title}</Text>
                          <Text style={styles.mutedSmall}>{description}</Text>
                        </View>
                        <View
                          style={[
                            styles.radio,
                            settings.action === item && styles.radioSelected,
                          ]}
                        />
                      </Pressable>
                    ))}
                  </View>
                  {settings.action === 'app' ? (
                    <Pressable
                      style={styles.appPicker}
                      onPress={() => loadApps()}
                    >
                      <Text style={styles.targetTitle}>
                        {apps.find(
                          app => app.packageName === settings.redirectPackage,
                        )?.label || 'Choose an app to open'}
                      </Text>
                      <Text style={styles.mutedSmall}>
                        Tap to select a redirect app
                      </Text>
                    </Pressable>
                  ) : null}

                  <SectionTitle title="Take a break" />
                  <View style={styles.breakSection}>
                    <Text style={styles.cardTitle}>
                      {settings.pausedUntil > now
                        ? `Paused for ${formatRemaining(
                            settings.pausedUntil,
                            now,
                          )}`
                        : 'Pause protection'}
                    </Text>
                    <Text style={styles.mutedSmall}>
                      {settings.pausedUntil > now
                        ? 'Protection resumes automatically when time is up.'
                        : 'Choose how long to pause.'}
                    </Text>
                    <View style={styles.durationRow}>
                      {(['5 Mins', '15 Mins', '1 Hour'] as const).map(item => (
                        <Pressable
                          key={item}
                          accessibilityRole="radio"
                          accessibilityState={{
                            selected:
                              settings.pauseDurationMinutes ===
                              durationMinutes(item),
                          }}
                          onPress={() =>
                            saveSettings({
                              pauseDurationMinutes: durationMinutes(item),
                            })
                          }
                          style={[
                            styles.durationButton,
                            settings.pauseDurationMinutes ===
                              durationMinutes(item) && styles.durationSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.durationText,
                              settings.pauseDurationMinutes ===
                                durationMinutes(item) &&
                                styles.durationSelectedText,
                            ]}
                          >
                            {item}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable
                      onPress={() =>
                        saveSettings({
                          pausedUntil:
                            settings.pausedUntil > now
                              ? 0
                              : Date.now() +
                                settings.pauseDurationMinutes * 60_000,
                        })
                      }
                      style={styles.outlineButton}
                    >
                      <Text style={styles.outlineButtonText}>
                        {settings.pausedUntil > now
                          ? 'Resume now'
                          : 'Pause blocker'}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={[styles.frictionRow, styles.row]}>
                    <View style={styles.flex}>
                      <Text style={styles.targetTitle}>Friction Lock</Text>
                      <Text style={styles.mutedSmall}>
                        Require a code to disable
                      </Text>
                    </View>
                    <Toggle
                      value={settings.frictionEnabled}
                      onValueChange={value =>
                        changeSetting('frictionEnabled', value)
                      }
                      label="Toggle friction lock"
                    />
                  </View>
                </>
              ) : null}

              {screen === 'Mindful pause' ? (
                <View style={styles.mindfulCard}>
                  <Text style={styles.eyebrow}>A MOMENT FOR YOU</Text>
                  <Text style={styles.pageTitle}>Take a breath.</Text>
                  <View style={styles.breathingCircle}>
                    <Text style={styles.breathingCount}>
                      {breathingSeconds > 0 ? breathingSeconds : '✓'}
                    </Text>
                  </View>
                  <Text style={styles.bodyText}>
                    {breathingSeconds > 0
                      ? 'Breathe in slowly, then let it go.'
                      : 'You’re back in control. Choose what you want to do next.'}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={breathingSeconds > 0}
                    onPress={() => nativeModule.finishMindfulPause()}
                    style={[
                      styles.primaryButton,
                      breathingSeconds > 0 && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>

        {!useNavigationRail ? (
          <View style={styles.navigationBar} accessibilityRole="tablist">
            {(['Dashboard', 'Permission', 'Configure'] as const).map(item => (
              <TabButton
                key={item}
                label={item}
                selected={screen === item}
                onPress={() => setScreen(item)}
              />
            ))}
          </View>
        ) : null}
      </View>

      <Modal
        transparent
        visible={pinMode !== null}
        animationType="fade"
        onRequestClose={() => {
          setPinMode(null);
          setPendingPatch(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>
              {pinMode === 'setup'
                ? 'Set a friction code'
                : 'Enter your friction code'}
            </Text>
            <Text style={styles.bodyText}>
              {pinMode === 'setup'
                ? 'Create a 4–8 digit code to confirm changes that disable protection.'
                : 'Confirm this change with your code.'}
            </Text>
            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              placeholder="4–8 digit code"
              placeholderTextColor="#687674"
              style={styles.pinInput}
            />
            {pinMode === 'setup' ? (
              <TextInput
                value={pinConfirmation}
                onChangeText={setPinConfirmation}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
                placeholder="Confirm code"
                placeholderTextColor="#687674"
                style={styles.pinInput}
              />
            ) : null}
            <Pressable onPress={() => submitPin()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Confirm</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setPinMode(null);
                setPendingPatch(null);
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.mutedSmall}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={appPickerVisible}
        animationType="slide"
        onRequestClose={() => setAppPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>Choose a productive app</Text>
            <ScrollView style={styles.appList}>
              {apps.map(app => (
                <Pressable
                  key={app.packageName}
                  onPress={() => {
                    setAppPickerVisible(false);
                    saveSettings({
                      action: 'app',
                      redirectPackage: app.packageName,
                    });
                  }}
                  style={styles.appOption}
                >
                  <Text style={styles.targetTitle}>{app.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setAppPickerVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.mutedSmall}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function durationMinutes(duration: Duration) {
  if (duration === '5 Mins') return 5;
  if (duration === '1 Hour') return 60;
  return 15;
}

function formatRemaining(until: number, now: number) {
  const minutes = Math.max(1, Math.ceil((until - now) / 60_000));
  return minutes >= 60 ? '1 hour' : `${minutes} min${minutes === 1 ? '' : 's'}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1112',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  expandedContainer: {
    maxWidth: 1040,
  },
  header: {
    height: 66,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#263233',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMark: {
    width: 34,
    height: 34,
    marginRight: 10,
  },
  brand: {
    color: '#EEF4F2',
    fontSize: 17,
    fontWeight: '700',
  },
  screenBody: {
    flex: 1,
    minHeight: 0,
  },
  expandedScreenBody: {
    flexDirection: 'row',
  },
  pageContent: {
    flex: 1,
  },
  wideContent: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  navigationBar: {
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#263233',
    backgroundColor: '#111819',
  },
  navigationRail: {
    width: 168,
    paddingHorizontal: 12,
    paddingTop: 16,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#263233',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  railTab: {
    flex: 0,
    alignItems: 'flex-start',
    minHeight: 52,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  selectedTab: {
    backgroundColor: '#25302F',
  },
  pressedTab: {
    opacity: 0.72,
  },
  tabText: {
    color: '#849391',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedTabText: {
    color: '#EEF4F2',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  pageTitle: {
    color: '#EEF4F2',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 20,
  },
  eyebrow: {
    color: '#849391',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 7,
  },
  card: {
    padding: 17,
    borderRadius: 17,
    backgroundColor: '#141C1D',
    borderWidth: 1,
    borderColor: '#263233',
    marginBottom: 22,
  },
  activeCard: {
    backgroundColor: '#172321',
    borderColor: '#2D4841',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  cardTitle: {
    color: '#EEF4F2',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusText: {
    color: '#849391',
    fontSize: 12,
    marginTop: 16,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 11,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    color: '#EEF4F2',
    fontSize: 15,
    fontWeight: '700',
  },
  mutedSmall: {
    color: '#849391',
    fontSize: 11,
  },
  targetRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263233',
    backgroundColor: '#141C1D',
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 22,
  },
  impactText: {
    color: '#849391',
    fontSize: 12,
  },
  permissionContent: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#263233',
    backgroundColor: '#141C1D',
  },
  targetTitle: {
    color: '#DCE6E3',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#263233',
    marginVertical: 10,
  },
  bodyText: {
    color: '#A3AFAD',
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 10,
  },
  primaryButton: {
    height: 50,
    backgroundColor: mint,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#0B1516',
    fontWeight: '700',
    fontSize: 14,
  },
  optionRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionList: {
    paddingHorizontal: 16,
    marginBottom: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263233',
    backgroundColor: '#141C1D',
  },
  radio: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#849391',
    borderRadius: 9,
    marginLeft: 12,
  },
  radioSelected: {
    borderWidth: 5,
    borderColor: mint,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
  },
  durationButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: '#0D1314',
  },
  durationSelected: {
    backgroundColor: mint,
  },
  durationText: {
    color: '#A3AFAD',
    fontSize: 12,
    fontWeight: '600',
  },
  durationSelectedText: {
    color: '#0B1516',
  },
  outlineButton: {
    alignSelf: 'flex-start',
    marginTop: 13,
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#355448',
  },
  outlineButtonText: {
    color: mint,
    fontSize: 12,
    fontWeight: '700',
  },
  appPicker: {
    padding: 15,
    marginTop: -12,
    marginBottom: 22,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#263233',
    backgroundColor: '#141C1D',
  },
  breakSection: {
    padding: 17,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#263233',
    backgroundColor: '#141C1D',
  },
  frictionRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#141C1D',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mindfulCard: {
    alignItems: 'center',
    paddingTop: 26,
  },
  breathingCircle: {
    width: 150,
    height: 150,
    marginVertical: 28,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: '#427c68',
    backgroundColor: '#172321',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCount: {
    color: mint,
    fontSize: 42,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.45,
  },
  modalBackdrop: {
    flex: 1,
    padding: 22,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  modalCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#141C1D',
    borderWidth: 1,
    borderColor: '#263233',
  },
  pinInput: {
    height: 48,
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#344142',
    color: '#EEF4F2',
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    padding: 14,
  },
  appList: {
    maxHeight: 420,
    marginTop: 10,
  },
  appOption: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#263233',
  },
  unsupported: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

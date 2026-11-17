import { useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonList } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useProfileQuery } from '@/hooks/useProfile';
import { useTranslation } from '@/i18n/useTranslation';
import {
  changePasswordFormSchema,
  editProfileFormSchema,
  type ChangePasswordFormValues,
  type EditProfileFormValues,
} from '@/schemas/profile';
import { useTheme } from '@/theme/useTheme';
import { ApiError } from '@/types/api';

const MAX_AVATAR_DATA_URI_LENGTH = 135_000;

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { formatAmount } = useCurrencies();
  const { user, profile: ctxProfile, updateProfile, changePassword, logout, logoutAll } = useAuth();

  const profileQuery = useProfileQuery();
  const profileData = profileQuery.data ?? ctxProfile;

  // Edit profile sheet state
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false);

  // Change password sheet state
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [passwordError, setPasswordError] = useState(null as string | null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Logout confirmation states
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const softBorderColor = theme.isDark ? theme.colors.border : `${theme.colors.border}B8`;
  const surfaceSubtle = theme.isDark ? theme.colors.surfaceAlt : `${theme.colors.surfaceAlt}90`;

  const editForm = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileFormSchema),
    defaultValues: {
      name: profileData?.name ?? user?.name ?? '',
      email: profileData?.email ?? user?.email ?? '',
      currentPassword: '',
    },
  });

  const watchedEmail = useWatch({ control: editForm.control, name: 'email' });
  const currentEmail = (profileData?.email ?? user?.email ?? '').trim().toLowerCase();
  const isEmailChanged =
    Boolean(watchedEmail) && watchedEmail.trim().toLowerCase() !== currentEmail;

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!profileData) return;
    editForm.reset({
      name: profileData.name,
      email: profileData.email,
      currentPassword: '',
    });
  }, [profileData, editForm]);

  const handleOpenEditProfile = () => {
    setEditError(null);
    editForm.reset({
      name: profileData?.name ?? user?.name ?? '',
      email: profileData?.email ?? user?.email ?? '',
      currentPassword: '',
    });
    setEditSheetOpen(true);
  };

  const handleOpenChangePassword = () => {
    setPasswordError(null);
    passwordForm.reset({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordSheetOpen(true);
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(t('profile.gallery_permission_denied'), 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      setUploadingAvatar(true);
      const asset = result.assets[0];

      // Resize to 256px width & compress as JPEG (~0.7) so base64 data URI < 100 KB (PRO-02)
      let manipulated = await manipulateAsync(
        asset.uri,
        [{ resize: { width: 256, height: 256 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true },
      );

      let dataUri = manipulated.base64 ? `data:image/jpeg;base64,${manipulated.base64}` : '';

      // Extra safety pass if image is still unusually large
      if (dataUri.length > MAX_AVATAR_DATA_URI_LENGTH) {
        manipulated = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 192, height: 192 } }],
          { compress: 0.5, format: SaveFormat.JPEG, base64: true },
        );
        dataUri = manipulated.base64 ? `data:image/jpeg;base64,${manipulated.base64}` : '';
      }

      if (!dataUri) {
        showToast(t('errors.UNKNOWN'), 'error');
        return;
      }

      await updateProfile({ avatar: dataUri });
      await profileQuery.refetch();
      showToast(t('profile.avatar_updated_toast'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await updateProfile({ avatar: null });
      await profileQuery.refetch();
      setConfirmRemoveAvatar(false);
      showToast(t('profile.avatar_removed_toast'), 'success');
    } catch (err) {
      setConfirmRemoveAvatar(false);
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(t('errors.UNKNOWN'), 'error');
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmitProfile = async (values: EditProfileFormValues) => {
    setEditError(null);
    const nextName = values.name.trim();
    const nextEmail = values.email.trim().toLowerCase();
    const emailChanged = nextEmail !== currentEmail;

    if (emailChanged && (!values.currentPassword || values.currentPassword.length < 8)) {
      setEditError(t('profile.validation.current_password_for_email'));
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        name: nextName,
        ...(emailChanged
          ? { email: nextEmail, currentPassword: values.currentPassword }
          : {}),
      });
      await profileQuery.refetch();
      setEditSheetOpen(false);
      showToast(t('profile.updated_toast'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        const key = `errors.${err.code}`;
        const translated = t(key);
        setEditError(translated !== key ? translated : err.message);
      } else {
        setEditError(t('errors.UNKNOWN'));
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const onSubmitPassword = async (values: ChangePasswordFormValues) => {
    setPasswordError(null);
    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setPasswordSheetOpen(false);
      showToast(t('profile.password_changed_toast'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        const key = `errors.${err.code}`;
        const translated = t(key);
        setPasswordError(translated !== key ? translated : err.message);
      } else {
        setPasswordError(t('errors.UNKNOWN'));
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  };

  const handleConfirmLogoutAll = async () => {
    setLoggingOut(true);
    try {
      await logoutAll();
    } finally {
      setLoggingOut(false);
      setConfirmLogoutAll(false);
    }
  };

  const displayName = profileData?.name ?? user?.name ?? '';
  const displayEmail = profileData?.email ?? user?.email ?? '';
  const avatarUri = profileData?.avatar ?? user?.avatar ?? null;
  const initials = displayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xxl * 2,
          gap: theme.spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching && !profileQuery.isLoading}
            onRefresh={() => void profileQuery.refetch()}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header — Soft Depth Back Button */}
        <View style={[styles.headerRow, { gap: theme.spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              {
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: theme.colors.surface,
                borderColor: softBorderColor,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.text} />
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="title">{t('profile.title')}</AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              {t('profile.subtitle')}
            </AppText>
          </View>
        </View>

        {profileQuery.isLoading && !profileData ? (
          <SkeletonList count={3} itemHeight={110} />
        ) : profileQuery.isError && !profileData ? (
          <Card>
            <ErrorState
              message={profileQuery.error.message}
              onRetry={() => void profileQuery.refetch()}
            />
          </Card>
        ) : (
          <>
            {/* Avatar & Identity Hero Card (PRO-01, PRO-02) */}
            <Card
              style={{
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.lg,
                borderRadius: theme.radius.card + 2,
                borderColor: softBorderColor,
              }}
            >
              <Pressable
                accessibilityRole="button"
                disabled={uploadingAvatar}
                onPress={() => void handlePickAvatar()}
                style={styles.avatarWrapper}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={[
                      styles.avatarImage,
                      {
                        borderRadius: theme.radius.full,
                        borderColor: `${theme.colors.primary}50`,
                      },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      {
                        backgroundColor: `${theme.colors.primary}18`,
                        borderColor: `${theme.colors.primary}40`,
                        borderWidth: 2,
                        borderRadius: theme.radius.full,
                      },
                    ]}
                  >
                    <AppText variant="title" color={theme.colors.primary}>
                      {initials}
                    </AppText>
                  </View>
                )}
                <View
                  style={[
                    styles.cameraBadge,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: softBorderColor,
                      borderRadius: theme.radius.full,
                    },
                  ]}
                >
                  <Feather name="camera" size={14} color={theme.colors.primary} />
                </View>
              </Pressable>

              <AppText variant="caption" muted>
                {uploadingAvatar ? t('common.updating') : t('profile.change_avatar')}
              </AppText>

              {avatarUri ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={uploadingAvatar}
                  onPress={() => setConfirmRemoveAvatar(true)}
                  style={{ paddingVertical: 2 }}
                >
                  <AppText variant="caption" color={theme.colors.danger}>
                    {t('profile.remove_avatar')}
                  </AppText>
                </Pressable>
              ) : null}

              <View style={{ alignItems: 'center', gap: 2, marginTop: 2 }}>
                <AppText variant="subtitle">{displayName}</AppText>
                <AppText variant="caption" muted>
                  {displayEmail}
                </AppText>
              </View>

              <Badge label={t('profile.active')} variant="success" />

              <Pressable
                accessibilityRole="button"
                onPress={handleOpenEditProfile}
                style={({ pressed }) => [
                  styles.softEditBtn,
                  {
                    width: '100%',
                    minHeight: 42,
                    marginTop: theme.spacing.xs,
                    borderRadius: 12,
                    backgroundColor: `${theme.colors.primary}12`,
                    borderColor: `${theme.colors.primary}28`,
                    opacity: pressed ? 0.8 : 1,
                    gap: 8,
                  },
                ]}
              >
                <Feather name="edit-2" size={15} color={theme.colors.primary} />
                <AppText variant="bodyStrong" color={theme.colors.primary}>
                  {t('profile.edit')}
                </AppText>
              </Pressable>
            </Card>

            {/* 3 Statistics Cards (PRO-03) — Soft Layered Grid */}
            <View style={[styles.statsGrid, { gap: theme.spacing.sm }]}>
              <Card
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                  borderRadius: theme.radius.card,
                  borderColor: softBorderColor,
                }}
              >
                <View style={[styles.statHeader, { gap: 8 }]}>
                  <View
                    style={[
                      styles.statIconBox,
                      { backgroundColor: `${theme.colors.primary}14`, borderRadius: 10 },
                    ]}
                  >
                    <Feather name="repeat" size={16} color={theme.colors.primary} />
                  </View>
                  <AppText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
                    {t('profile.total_transactions')}
                  </AppText>
                </View>
                <AppText variant="title" style={{ fontSize: 22 }}>
                  {profileData?.stats?.transactionCount ?? 0}
                </AppText>
              </Card>

              <Card
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                  borderRadius: theme.radius.card,
                  borderColor: softBorderColor,
                }}
              >
                <View style={[styles.statHeader, { gap: 8 }]}>
                  <View
                    style={[
                      styles.statIconBox,
                      { backgroundColor: `${theme.colors.info}14`, borderRadius: 10 },
                    ]}
                  >
                    <Feather name="target" size={16} color={theme.colors.info} />
                  </View>
                  <AppText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
                    {t('profile.saving_targets')}
                  </AppText>
                </View>
                <AppText variant="title" style={{ fontSize: 22 }}>
                  {profileData?.stats?.savingsGoalCount ?? 0}
                </AppText>
              </Card>
            </View>

            <Card
              style={{
                padding: theme.spacing.lg,
                borderRadius: theme.radius.card + 2,
                borderColor: softBorderColor,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.income,
              }}
            >
              <View style={[styles.statHeader, { gap: theme.spacing.md }]}>
                <View
                  style={[
                    styles.statIconBoxLarge,
                    { backgroundColor: `${theme.colors.income}14`, borderRadius: 12 },
                  ]}
                >
                  <Feather name="award" size={19} color={theme.colors.income} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="caption" muted>
                    {t('profile.total_savings')}
                  </AppText>
                  <AppText
                    variant="title"
                    color={theme.colors.income}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatAmount(profileData?.stats?.totalSavings ?? 0)}
                  </AppText>
                </View>
              </View>
            </Card>

            {/* Account Security Section (AUTH-05, AUTH-06) — Soft Island List */}
            <Card
              style={{
                padding: theme.spacing.lg,
                gap: theme.spacing.md,
                borderRadius: theme.radius.card + 2,
                borderColor: softBorderColor,
              }}
            >
              <View style={[styles.statHeader, { gap: theme.spacing.sm }]}>
                <View
                  style={[
                    styles.statIconBox,
                    { backgroundColor: `${theme.colors.primary}14`, borderRadius: 10 },
                  ]}
                >
                  <Feather name="shield" size={16} color={theme.colors.primary} />
                </View>
                <AppText variant="subtitle">{t('profile.security_section')}</AppText>
              </View>

              <View style={{ gap: theme.spacing.sm }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleOpenChangePassword}
                  style={({ pressed }) => [
                    styles.securityRow,
                    {
                      padding: theme.spacing.md,
                      borderRadius: 12,
                      backgroundColor: pressed ? theme.colors.border : surfaceSubtle,
                      borderColor: softBorderColor,
                      gap: theme.spacing.md,
                    },
                  ]}
                >
                  <Feather name="lock" size={18} color={theme.colors.primary} />
                  <AppText variant="bodyStrong" style={{ flex: 1 }}>
                    {t('profile.change_password')}
                  </AppText>
                  <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConfirmLogoutAll(true)}
                  style={({ pressed }) => [
                    styles.securityRow,
                    {
                      padding: theme.spacing.md,
                      borderRadius: 12,
                      backgroundColor: pressed ? theme.colors.border : surfaceSubtle,
                      borderColor: softBorderColor,
                      gap: theme.spacing.md,
                    },
                  ]}
                >
                  <Feather name="smartphone" size={18} color={theme.colors.warning} />
                  <AppText variant="bodyStrong" style={{ flex: 1 }}>
                    {t('profile.logout_all_devices')}
                  </AppText>
                  <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConfirmLogout(true)}
                  style={({ pressed }) => [
                    styles.securityRow,
                    {
                      padding: theme.spacing.md,
                      borderRadius: 12,
                      backgroundColor: `${theme.colors.danger}12`,
                      borderColor: `${theme.colors.danger}30`,
                      opacity: pressed ? 0.8 : 1,
                      gap: theme.spacing.md,
                    },
                  ]}
                >
                  <Feather name="log-out" size={18} color={theme.colors.danger} />
                  <AppText variant="bodyStrong" color={theme.colors.danger} style={{ flex: 1 }}>
                    {t('auth.logout')}
                  </AppText>
                  <Feather name="chevron-right" size={18} color={theme.colors.danger} />
                </Pressable>
              </View>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Edit Name & Email BottomSheet (PRO-01, 16.3) */}
      <BottomSheet
        visible={editSheetOpen}
        onClose={() => setEditSheetOpen(false)}
        title={t('profile.edit')}
      >
        <View style={{ gap: theme.spacing.md }}>
          {editError ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: `${theme.colors.danger}18`,
                  borderColor: theme.colors.danger,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                },
              ]}
            >
              <Feather name="alert-circle" size={18} color={theme.colors.danger} />
              <AppText variant="caption" color={theme.colors.danger} style={{ flex: 1 }}>
                {editError}
              </AppText>
            </View>
          ) : null}

          <Controller
            control={editForm.control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('profile.name')}
                placeholder={t('auth.name_placeholder')}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={
                  editForm.formState.errors.name?.message
                    ? t(editForm.formState.errors.name.message)
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={editForm.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('profile.email')}
                placeholder={t('auth.email_placeholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={
                  editForm.formState.errors.email?.message
                    ? t(editForm.formState.errors.email.message)
                    : undefined
                }
              />
            )}
          />

          {isEmailChanged ? (
            <Controller
              control={editForm.control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ gap: theme.spacing.xs }}>
                  <TextField
                    label={t('profile.current_password')}
                    placeholder={t('profile.current_password_email_hint')}
                    secureToggle
                    value={value ?? ''}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                  <AppText variant="caption" color={theme.colors.info}>
                    {t('profile.email_change_password_notice')}
                  </AppText>
                </View>
              )}
            />
          ) : null}

          <View style={[styles.sheetButtons, { gap: theme.spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                label={t('common.cancel')}
                disabled={savingProfile}
                onPress={() => setEditSheetOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.save')}
                loading={savingProfile}
                onPress={editForm.handleSubmit(onSubmitProfile)}
              />
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* Change Password BottomSheet (AUTH-05, SEC-02) */}
      <BottomSheet
        visible={passwordSheetOpen}
        onClose={() => setPasswordSheetOpen(false)}
        title={t('profile.change_password')}
      >
        <View style={{ gap: theme.spacing.md }}>
          {passwordError ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: `${theme.colors.danger}18`,
                  borderColor: theme.colors.danger,
                  borderRadius: theme.radius.control,
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                },
              ]}
            >
              <Feather name="alert-circle" size={18} color={theme.colors.danger} />
              <AppText variant="caption" color={theme.colors.danger} style={{ flex: 1 }}>
                {passwordError}
              </AppText>
            </View>
          ) : null}

          <Controller
            control={passwordForm.control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('profile.current_password')}
                placeholder="••••••••"
                secureToggle
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={
                  passwordForm.formState.errors.currentPassword?.message
                    ? t(passwordForm.formState.errors.currentPassword.message)
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={passwordForm.control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('profile.new_password')}
                placeholder={t('auth.password_placeholder')}
                secureToggle
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={
                  passwordForm.formState.errors.newPassword?.message
                    ? t(passwordForm.formState.errors.newPassword.message)
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={passwordForm.control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('profile.confirm_new_password')}
                placeholder="••••••••"
                secureToggle
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={
                  passwordForm.formState.errors.confirmPassword?.message
                    ? t(passwordForm.formState.errors.confirmPassword.message)
                    : undefined
                }
              />
            )}
          />

          <AppText variant="caption" muted>
            {t('profile.password_change_hint')}
          </AppText>

          <View style={[styles.sheetButtons, { gap: theme.spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                label={t('common.cancel')}
                disabled={savingPassword}
                onPress={() => setPasswordSheetOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.save')}
                loading={savingPassword}
                onPress={passwordForm.handleSubmit(onSubmitPassword)}
              />
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* Confirm Remove Avatar */}
      <ConfirmDialog
        visible={confirmRemoveAvatar}
        title={t('profile.remove_avatar')}
        message={t('profile.remove_avatar_confirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={uploadingAvatar}
        onCancel={() => setConfirmRemoveAvatar(false)}
        onConfirm={() => void handleRemoveAvatar()}
      />

      {/* Confirm Logout Current Device */}
      <ConfirmDialog
        visible={confirmLogout}
        title={t('auth.logout_title')}
        message={t('common.logout_confirm')}
        confirmLabel={t('auth.logout')}
        cancelLabel={t('common.cancel')}
        danger
        loading={loggingOut}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => void handleConfirmLogout()}
      />

      {/* Confirm Logout All Devices (AUTH-06) */}
      <ConfirmDialog
        visible={confirmLogoutAll}
        title={t('profile.logout_all_devices')}
        message={t('profile.logout_all_confirm')}
        confirmLabel={t('profile.logout_all_devices')}
        cancelLabel={t('common.cancel')}
        danger
        loading={loggingOut}
        onCancel={() => setConfirmLogoutAll(false)}
        onConfirm={() => void handleConfirmLogoutAll()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
    width: 88,
    height: 88,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBoxLarge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  sheetButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

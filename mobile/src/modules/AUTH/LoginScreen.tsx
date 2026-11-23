
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Txt, Button } from '../../components/Primitives';
import { colors } from '../../config/theme';
import { settings } from '../../config/env';
import { useApp } from '../../context/AppContext';
import { supabaseAuth } from '../../auth/supabase';

export function LoginScreen() {
  const { signInReal } = useApp();

  const [register, setRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const cambiarModo = () => {
    if (busy) return;
    setRegister(v => !v);
    setPassword('');
    setConfirmPassword('');
  };

  const enter = async () => {
    if (busy) return;

    if (settings.dataSource !== 'api' || !supabaseAuth) {
      Alert.alert(
        'Sin conexión configurada',
        'La aplicación debe estar configurada con Supabase y la API real.'
      );
      return;
    }

    const correo = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      Alert.alert(
        'Correo inválido',
        'Introduce un correo electrónico válido.'
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Contraseña inválida',
        'La contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    if (register) {
      if (nombre.trim().length < 3) {
        Alert.alert(
          'Nombre requerido',
          'Introduce tu nombre completo.'
        );
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          'Contraseñas diferentes',
          'Las contraseñas no coinciden.'
        );
        return;
      }
    }

    setBusy(true);

    try {
      if (register) {
        const { data, error } =
          await supabaseAuth.auth.signUp({
            email: correo,
            password,
            options: {
              data: {
                full_name: nombre.trim(),
              },
            },
          });

        if (error) {
          throw new Error(error.message);
        }

        if (!data.user) {
          throw new Error(
            'No se pudo completar el registro.'
          );
        }

        // Evita mantener una sesión abierta antes
        // de comprobar el perfil del usuario.
        if (data.session) {
          await supabaseAuth.auth.signOut();
        }

        setRegister(false);
        setPassword('');
        setConfirmPassword('');

        Alert.alert(
          'Solicitud de registro recibida',
          data.session
            ? 'Tu cuenta de acceso fue creada. Inicia sesión cuando tu perfil de comprador esté habilitado.'
            : 'Revisa tu correo electrónico y confirma tu cuenta. Después podrás iniciar sesión cuando tu perfil esté habilitado.',
          [{ text: 'Entendido' }]
        );

        return;
      }

      // Inicio de sesión con Supabase Auth
      // y verificación de identidad en NestJS.
      await signInReal(correo, password);

    } catch (error) {
      Alert.alert(
        register
          ? 'No se pudo registrar'
          : 'No se pudo iniciar sesión',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.base}
      behavior={
        Platform.OS === 'ios' ? 'padding' : undefined
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.arc}>
          <View style={styles.arcInner} />
        </View>

        <View
          style={{
            paddingTop:
              Platform.OS === 'web' ? 118 : 165,
          }}
        >
          <Txt
            size={30}
            bold
            style={{ letterSpacing: -1 }}
          >
            {register ? 'Regístrate' : 'Iniciar sesión'}
          </Txt>

          <Txt
            muted
            size={13}
            style={{ marginTop: 8 }}
          >
            Cofre Express · Compras y entregas
          </Txt>
        </View>

        <View style={styles.row}>
          <Txt size={12}>
            {register
              ? '¿Ya tienes una cuenta?'
              : '¿No tienes una cuenta?'}
          </Txt>

          <Pressable onPress={cambiarModo}>
            <Txt
              size={12}
              bold
              style={{ color: colors.red }}
            >
              {register
                ? 'Iniciar sesión'
                : 'Regístrate aquí'}
            </Txt>
          </Pressable>
        </View>

        {register && (
          <View style={styles.inputWrap}>
            <Feather
              name="user"
              size={15}
              color={colors.muted}
            />

            <TextInput
              placeholder="Nombre completo"
              value={nombre}
              onChangeText={setNombre}
              maxLength={100}
              placeholderTextColor="#969696"
              style={styles.field}
            />
          </View>
        )}

        <View style={styles.inputWrap}>
          <Feather
            name="mail"
            size={15}
            color={colors.muted}
          />

          <TextInput
            placeholder="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            maxLength={254}
            placeholderTextColor="#969696"
            style={styles.field}
          />
        </View>

        <View style={styles.inputWrap}>
          <Feather
            name="lock"
            size={15}
            color={colors.muted}
          />

          <TextInput
            placeholder="Contraseña"
            secureTextEntry={!show}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#969696"
            style={styles.field}
          />

          <Pressable
            onPress={() => setShow(v => !v)}
          >
            <Feather
              name={show ? 'eye-off' : 'eye'}
              size={16}
              color={colors.muted}
            />
          </Pressable>
        </View>

        {register && (
          <View style={styles.inputWrap}>
            <Feather
              name="shield"
              size={15}
              color={colors.muted}
            />

            <TextInput
              placeholder="Confirmar contraseña"
              secureTextEntry={!show}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#969696"
              style={styles.field}
            />
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <Button
            variant="amber"
            disabled={busy}
            label={
              busy
                ? 'Procesando...'
                : register
                  ? 'Crear mi cuenta'
                  : 'Iniciar sesión'
            }
            onPress={enter}
          />
        </View>

        <Txt
          muted
          size={11}
          style={{
            textAlign: 'center',
            lineHeight: 17,
            marginTop: 12,
          }}
        >
          {register
            ? 'Regístrate con tu correo electrónico. Es posible que debas confirmarlo antes de iniciar sesión.'
            : 'Ingresa con tu cuenta registrada de Cofre Express.'}
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: 'white',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 34,
    paddingBottom: 30,
    gap: 14,
  },
  arc: {
    position: 'absolute',
    top: -100,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.amber,
  },
  arcInner: {
    position: 'absolute',
    top: 100,
    left: 100,
    width: 115,
    height: 140,
    borderRadius: 90,
    backgroundColor: 'white',
    opacity: 0.06,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  inputWrap: {
    minHeight: 48,
    borderRadius: 30,
    backgroundColor: '#F6F5F4',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  field: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
  },
});

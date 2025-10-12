import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Image, Dimensions } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('../assets/background.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Header rojo */}
        <View style={styles.header}>
          <Image source={require('../assets/piaget-icon.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>
              Instituto{"\n"}Jean Piaget <Text style={styles.headerNumber}>N°8048</Text>
            </Text>
          </View>
        </View>

        {/* Contenedor principal estilo tarjeta */}
        <View style={styles.card}>
          {/* Sección azul */}
          <View style={styles.topSection}>
            <Text style={styles.welcomeText}>BIENVENIDOS</Text>
            <View style={styles.separator} />
            <Text style={styles.description}>
              Accede de manera segura a la información relevante y forma parte de una comunidad educativa conectada.
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
              <FontAwesome name="arrow-right" size={18} color="#fff" style={{ marginLeft: 10 }} />
            </TouchableOpacity>

            <View style={styles.middleSeparator}>
              <View style={styles.line} />
              <Text style={styles.orText}>O puedes registrarte</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.button2} onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.buttonText}>Registrarse</Text>
              <FontAwesome name="user-plus" size={18} color="#fff" style={{ marginLeft: 10 }} />
            </TouchableOpacity>

            {/* Botón About Us dentro de la card */}
            <TouchableOpacity 
              style={styles.aboutContainer}
              onPress={() => navigation.navigate("AboutUs")}
            >
              <Text style={styles.aboutText}>Sobre nosotros</Text>
              <FontAwesome name="info-circle" size={18} color="#1E2A78" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Jean Piaget</Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 0,
    backgroundColor: '#000000c6',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C8102E",
    boxShadow: '6px 2px 6px 1px #0000007e',
  },
  logo: {
    width: 105,
    height: 105,
    resizeMode: "cover",
    marginTop: -15,
    marginBottom: -10,
    marginLeft: -15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
    marginLeft: -10,
  },
  headerNumber: {
    color: "#fff",
    fontSize: 13,
  },
  card: {
    marginTop: 10,
    flex:1,
    marginHorizontal: 2,
    marginVertical: 2,
    backgroundColor: "#ffffff9b",
  },
  topSection: {
    marginTop: 30,
    marginHorizontal:10,
    backgroundColor: "#1E2A78",
    padding: 30,
    alignItems: "center",
    shadowColor: '#000000',
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 100,
    shadowRadius: 0,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  separator: {
    width: 140,
    height: 2,
    backgroundColor: "#fff",
    marginVertical: 10,
  },
  description: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
    lineHeight: 20,
  },
  bottomSection: {
    alignItems: "center",
    padding: 25,
    marginVertical: 60, // Reducido para dar espacio al nuevo botón
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E2A78",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 6,
    elevation: 6,
    marginBottom: 15,
  },
  button2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C8102E",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 6,
    elevation: 6,
    marginTop: 30,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  middleSeparator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  line: {
    width: 80,
    height: 1,
    backgroundColor: "#000",
  },
  orText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: "#555",
  },
  aboutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 170,
    marginLeft: 240,
  },
  aboutText: {
    fontSize: 15,
    color: "#1E2A78",
    marginRight: 8,
    fontWeight: '500',
  },
  flexSpacer: {
    flex: 1,
    minHeight: 30, // Espacio mínimo para asegurar que el footer quede fuera de la vista inicial
  },
  footer: {
    width: width,
    alignItems: "center",
    padding: 15,
    backgroundColor: "#1E2A78",
  },
  footerText: {
    fontSize: 13,
    color: "#fff",
  },
});
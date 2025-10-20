import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Modal,
  Animated,
  FlatList,
  ScrollView,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerDetalle() {
  const navigation = useNavigation();
  const route = useRoute();
  const { alumno } = route.params || {};

  // Función para formatear fechas
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-ES');
  };

  // Función para calcular la edad
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = birthDate.toDate ? birthDate.toDate() : new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // --- ESTADOS ---
  const [menuVisible, setMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const isFocused = useIsFocused();
  const [imageUri, setImageUri] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  // --- FUNCIONES ---
  const showCustomAlert = (title, message, confirmAction) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirm(() => confirmAction);
    setShowAlert(true);
  };



  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser; 
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
    
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setImageUri(userData.photoURL || null);
        } else {
          console.log("No se encontraron datos para este usuario.");
        }
      } else {
        navigation.replace('Login');
      }
    };
    
    if (isFocused) {
      fetchUserData();
    }
  }, [isFocused]);
      
  const handleLogOut = async () => {
    try {
      await signOut(auth);  
      navigation.replace('Login');
    } catch (error) {
      showCustomAlert("Error", "Ha ocurrido un problema al cerrar sesión.", () => setShowAlert(false));
    }
  };
      
  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  
      
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('../assets/background.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('../assets/piaget-icon.png')} style={styles.logo} />
            <View>
              <Text style={styles.headerTitle}>Instituto{"\n"}Jean Piaget <Text style={styles.headerNumber}>N°8048</Text></Text>
            </View>
          </View> 
          <View style={styles.headerRight}>
            <View style={styles.headerBlue}>
              <View style={styles.iconPlacing}>
                <TouchableOpacity onPress={() => imageUri && setImageModalVisible(true)}>
                  <View style={styles.tutorIconBackground}>
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: 50 }} resizeMode="cover"/>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleMenu} style={styles.menuIcon}>
                  <MaterialCommunityIcons name="menu-down" size={32} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <Modal
          transparent={true}
          visible={menuVisible}
          animationType="none"
          onRequestClose={toggleMenu}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={toggleMenu}
          >
            <Animated.View 
              style={[
                styles.button,
                { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }
              ]}
            >
              <View>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    toggleMenu();
                    navigation.navigate('PerfilUsuario');
                  }}>
                  <Text style={styles.buttonText}>Ver Perfil</Text>
                  <Ionicons name="person-outline" size={22} color="white" paddingLeft={5} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    toggleMenu();
                    showCustomAlert("Cerrar Sesión", "¿Confirma que quiere cerrar sesión?", handleLogOut);
                  }}>
                  <Text style={styles.buttonText}>Cerrar sesión</Text>
                  <Ionicons name="exit-outline" size={22} color="white" paddingLeft={5} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
        
        <View style={styles.mainContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <FontAwesome name="arrow-left" size={25} color="#031666ff" style={styles.backIcon} />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.listContentContainer}>
            {alumno ? (
              <>
                {/* SECCIÓN ALUMNO */}
                <Text style={styles.sectionTitle}>Información del Alumno</Text>
                <View style={styles.cardContainer}>
                  <Text style={styles.nameText}>
                    {alumno.nombre_alumno} {alumno.apellido_alumno}
                  </Text>
                  <Text style={styles.subInfo}>{alumno.dni_alumno}</Text>
                  <Text style={styles.subInfoSmall}>Fecha de Inscripción: {formatDate(alumno.fecha_inscripcion)}</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Fecha de nacimiento</Text>
                    <Text style={styles.inputBox}>
                      {formatDate(alumno.fecha_nacimiento_alumno)} ({calculateAge(alumno.fecha_nacimiento_alumno)} años)
                    </Text>
                  </View>

                  <View style={styles.inlineInputs}>
                    <View style={styles.halfInput}>
                      <Text style={styles.inputLabel}>Género</Text>
                      <Text style={styles.inputBox}>{alumno.genero_alumno || 'N/A'}</Text>
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.inputLabel}>Grado</Text>
                      <Text style={styles.inputBox}>{alumno.nombre_grado || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Observaciones</Text>
                    <Text style={[styles.inputBox, { height: 70 }]}>{alumno.observaciones_alumno || 'Sin observaciones'}</Text>
                  </View>
                </View>

                {/* SECCIÓN TUTOR */}
                <Text style={styles.sectionTitle}>Información del Tutor</Text>
                <View style={styles.cardContainer}>
                  <Text style={styles.nameText}>
                    {alumno.nombre_tutor} {alumno.apellido_tutor}
                  </Text>
                  <Text style={styles.subInfo}>{alumno.dni_tutor}</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Parentesco</Text>
                    <Text style={styles.inputBox}>{alumno.parentesco || 'N/A'}</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Correo</Text>
                    <Text style={styles.inputBox}>{alumno.correo_tutor || 'N/A'}</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Teléfono</Text>
                    <Text style={styles.inputBox}>{alumno.numero_telefono || 'N/A'}</Text>
                  </View>
                </View>

              </>
              
            ) : (
              <Text style={styles.emptyText}>No se encontraron detalles del alumno.</Text>
            )}
          </View>
          </ScrollView>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Jean Piaget</Text>
        </View>

        <Modal
          visible={showAlert}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAlert(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalDetail}>
                <Text style={styles.modalTitle}>{alertTitle}</Text>
              </View>
              <Text style={styles.modalMessage}>{alertMessage}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, {borderColor: "#252861"}]}
                  onPress={() => setShowAlert(false)}
                >
                  <Text style={[styles.modalButtonText, {color: "#252861"}]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#DB2024", borderWidth: 0 }]}
                  onPress={() => {
                    onConfirm();
                    setShowAlert(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: "#fff"}]}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={imageModalVisible}
          onRequestClose={() => setImageModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.imageModalContainer} 
            activeOpacity={1} 
            onPress={() => setImageModalVisible(false)}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  button: {
    position: 'absolute',
    top: 60,
    right: 10,
    flexDirection: 'row',
    backgroundColor: '#252861',
    paddingVertical: 7,
    borderColor: '#000',
    borderWidth: 0.9,
    borderRadius: 5,
    marginTop: 18,
    alignSelf: 'flex-end',
    marginRight: -13,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '400',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    paddingBottom: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#C81B1E",
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBlue: {
    backgroundColor: "#252861",
    alignItems: 'flex-end',
    paddingTop: 4,
    width: 130,
    height:80,
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
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
    marginLeft: -10,
  },
  headerNumber: {
    color: "#fff",
    fontSize: 13,       
  },
  menuIcon: {
    paddingTop: 28,
  },
  iconPlacing: {
    padding: 7.6,
    flexDirection: 'row',
  },
  tutorIconBackground: {
    backgroundColor: '#fff',
    width: 45.3,
    height: 45.3,
    borderRadius: 70,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 15,
    width: '100%',
    backgroundColor: "#1E2A78",
    borderTopWidth: 2,
  },
  footerText: {
    fontSize: 13,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingBottom: 20,
    elevation: 5,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: "#000",
    shadowColor: '#272727',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 7,
  },
  modalDetail: {
    backgroundColor: '#C81B1E',
    paddingVertical: 10,
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: "bold",
    margin: 8,
    color: "#fff",
  },
  modalMessage: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
    paddingHorizontal: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2.5,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#031666ff',
    marginLeft: 8,
  },
  listContentContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 15,
    padding: 15,
  },
  sectionTitle: {
    backgroundColor: '#031666',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    elevation: 3,
    textTransform: 'uppercase',
  },

  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },

  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
  },

  subInfo: {
    fontSize: 18,
    color: '#C81B1E',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 3,
  },

  subInfoSmall: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 15,
  },

  inputGroup: {
    marginBottom: 12,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  inputBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#444',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#252861',
    textDecorationLine: 'underline',
  },
  newButton: {
    backgroundColor: '#252861',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  newButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cardInfo: {
    flex: 1,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    width: 90, 
  },
  infoValue1: {
    fontSize: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000000ff',
    flex: 1,
  },
  Dni: {
    fontSize: 20,
    textAlign: 'center',
    flex: 1,
    color: 'red',
  },
  Fechainsc: {
    fontSize: 10,
    textAlign: 'center',
    flex: 1,
    marginRight: '5%',
    color: '#555',
  },
  infoValue: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  cardId: {
    backgroundColor: '#252861',
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cardIdIcon: {
    marginBottom: 10,
  },
  cardIdText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewButton: {
    backgroundColor: '#f0f2f5',
  },
  modifyButton: {
    backgroundColor: '#3949ab',
  },
  deleteButton: {
    backgroundColor: '#C81B1E',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
    borderRadius: 15,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fefefeff',
    backgroundColor: '#031666ff',
    padding: '5%',
    marginBottom: '5%',
    textDecorationLine: 'underline',
    paddingHorizontal: '25%',
    paddingVertical: '3%',
    borderRadius: 5,
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  
});

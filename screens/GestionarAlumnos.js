import React, { useEffect, useState, useCallback } from 'react';
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
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { doc, getDoc, collection, query, getDocs, orderBy, updateDoc, increment, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GestionarAlumnos() {
  const navigation = useNavigation();
  
  // --- ESTADOS ---
  const [menuVisible, setMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertType, setAlertType] = useState("error");
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const isFocused = useIsFocused();
  const [imageUri, setImageUri] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  
  // Estados para la lista y búsqueda
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  //Validaciones
  const validadorsolonumeros = /^\d+$/


  const validarSearch = (dni) => {
    if (dni === '' || validadorsolonumeros.test(dni)) {
      setSearchText(dni);
    }
  };
  
  // --- FUNCIONES ---
  const showCustomAlert = (title, message, confirmAction, type = "error", needsCancel = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirm(() => confirmAction);
    setAlertType(type);
    setShowCancelButton(needsCancel); // Nuevo parámetro
    setShowAlert(true);
  };

  const handleEliminarAlumno = async (alumno) => {
    showCustomAlert(
      "Confirmar Eliminación",
      `¿Está seguro que desea eliminar al alumno ${alumno.nombre_alumno} ${alumno.apellido_alumno}?`,
      async () => {
        try {
          const alumnoRef = doc(db, "alumnos", alumno.id);
          
          await updateDoc(alumnoRef, {
            estado_alumno: false
          });

          const gradoRef = doc(db, "grados", alumno.id_grado);
          await updateDoc(gradoRef, {
            asientos_disponibles: increment(1)
          });

          const nuevaLista = alumnos.filter(a => a.id !== alumno.id);
          setAlumnos(nuevaLista);
          setFilteredAlumnos(nuevaLista);

          showCustomAlert(
            "Éxito",
            "El alumno ha sido eliminado correctamente.",
            () => setShowAlert(false),
            "success",
            false 
          );
        } catch (error) {
          console.error("Error al eliminar alumno: ", error);
          showCustomAlert(
            "Error",
            "Ocurrió un problema al eliminar el alumno. Intente nuevamente.",
            () => setShowAlert(false),
            "error",
            false 
          );
        }
      },
      "error",
      true 
    );
  };

  useFocusEffect(
    useCallback(() => {
      const fetchAlumnos = async () => {
        try {
          setLoading(true);
          
          // Consulta dinámica según el estado del switch
          const q = query(
            collection(db, "alumnos"), 
            where("estado_alumno", "==", showInactive ? false : true), // Cambia según el toggle
            orderBy("apellido_alumno", "asc")
          );
          
          const querySnapshot = await getDocs(q);
          const alumnosList = [];
          querySnapshot.forEach((doc) => {
            alumnosList.push({ id: doc.id, ...doc.data() });
          });
          setAlumnos(alumnosList);
          setFilteredAlumnos(alumnosList);
        } catch (error) {
          console.error("Error al obtener alumnos: ", error);
          showCustomAlert("Error", "No se pudo cargar la lista de alumnos.", () => setShowAlert(false), "error");
        } finally {
          setLoading(false);
        }
      };

      fetchAlumnos();
    }, [showInactive]) 
  );

  //Funcionn reactivar alumnos
  const handleReactivarAlumno = async (alumno) => {
    showCustomAlert(
      "Confirmar Reactivación",
      `¿Está seguro que desea reactivar al alumno ${alumno.nombre_alumno} ${alumno.apellido_alumno}?`,
      async () => {
        try {
          // Verificar si hay asientos disponibles en el grado
          const gradoDoc = await getDoc(doc(db, "grados", alumno.id_grado));
          const gradoData = gradoDoc.data();
          
          if (gradoData.asientos_disponibles <= 0) {
            showCustomAlert(
              "Error",
              `No hay asientos disponibles en ${alumno.nombre_grado}. Por favor, libere un asiento primero.`,
              () => setShowAlert(false),
              "error",
              false
            );
            return;
          }

          const alumnoRef = doc(db, "alumnos", alumno.id);
          
          await updateDoc(alumnoRef, {
            estado_alumno: true
          });

          const gradoRef = doc(db, "grados", alumno.id_grado);
          await updateDoc(gradoRef, {
            asientos_disponibles: increment(-1)
          });

          const nuevaLista = alumnos.filter(a => a.id !== alumno.id);
          setAlumnos(nuevaLista);
          setFilteredAlumnos(nuevaLista);

          showCustomAlert(
            "Éxito",
            "El alumno ha sido reactivado correctamente.",
            () => setShowAlert(false),
            "success",
            false
          );
        } catch (error) {
          console.error("Error al reactivar alumno: ", error);
          showCustomAlert(
            "Error",
            "Ocurrió un problema al reactivar el alumno. Intente nuevamente.",
            () => setShowAlert(false),
            "error",
            false
          );
        }
      },
      "error",
      true
    );
  };


  // Filtra los alumnos cuando el texto de búsqueda cambia
  useEffect(() => {
    if (searchText === '') {
      setFilteredAlumnos(alumnos);
    } else {
      const filtered = alumnos.filter(alumno => {
        //  dni_alumno a string para buscar
        const dniStr = alumno.dni_alumno ? alumno.dni_alumno.toString() : '';
        return dniStr.includes(searchText);
      });
      setFilteredAlumnos(filtered);
    }
  }, [searchText, alumnos]);

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
          console.log("No se encontraron datos para este usuario (ola).");
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
    showCustomAlert(
      "Cerrar Sesión",
      "¿Confirma que quiere cerrar sesión?",
      async () => {
        try {
          await signOut(auth);
          navigation.replace('Login');
        } catch (error) {
          showCustomAlert("Error", "Ha ocurrido un problema al cerrar sesión.", () => setShowAlert(false), "error", false);
        }
      },
      "error",
      true // SÍ necesita cancelar
    );
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

  // Función para renderizar la tarjeta de un alumno
  const renderAlumnoItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre:</Text>
            <Text style={styles.infoValue}>{item.nombre_alumno}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Apellido:</Text>
            <Text style={styles.infoValue}>{item.apellido_alumno}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Grado:</Text>
            <Text style={styles.infoValue}>{item.nombre_grado || 'N/A'}</Text>
          </View>
        </View>
        <View style={[styles.cardId, showInactive && { backgroundColor: '#666' }]}>
          <FontAwesome name="user-circle" size={50} color="white" style={styles.cardIdIcon} />
          <Text style={styles.cardIdText}>DNI: {item.dni_alumno}</Text>
          {showInactive && (
            <Text style={styles.inactiveLabel}>INACTIVO</Text>
          )}
        </View>
      </View>
      <View style={styles.cardActions}>
        {!showInactive ? (
          <>
            {/* Botones para alumnos ACTIVOS */}
            <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => navigation.navigate('VerDetalle', { alumno: item })}>
              <Ionicons name="eye-outline" size={16} color="#333" />
              <Text style={styles.actionButtonText}>Ver Datos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.modifyButton]} onPress={() => navigation.navigate('ModificarAlumno', { alumno: item })}>
              <MaterialCommunityIcons name="pencil" size={16} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]} >Modificar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleEliminarAlumno(item)}
            >
              <MaterialCommunityIcons name="delete" size={16} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]}>Eliminar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Botones para alumnos INACTIVOS */}
            <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => navigation.navigate('VerDetalle', { alumno: item })}>
              <Ionicons name="eye-outline" size={16} color="#333" />
              <Text style={styles.actionButtonText}>Ver Datos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.reactivateButton]}
              onPress={() => handleReactivarAlumno(item)}
            >
              <MaterialCommunityIcons name="restore" size={16} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]}>Reactivar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
      
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
                    handleLogOut();
                  }}>
                  <Text style={styles.buttonText}>Cerrar sesión</Text>
                  <Ionicons name="exit-outline" size={22} color="white" paddingLeft={5} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
        
        <KeyboardAvoidingView 
          style={styles.mainContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <FontAwesome name="arrow-left" size={25} color="#031666ff" style={styles.backIcon} />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>

          <View style={styles.listContentContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {showInactive ? 'Alumnos (Inactivos)' : 'Lista Alumnos'}
              </Text>
              <View style={styles.headerActions}>
                
                <TouchableOpacity 
                  style={styles.newButton} 
                  onPress={() => navigation.navigate('AddAlumnos')}
                >
                  <Text style={styles.newButtonText}>Nuevo Alumno +</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toggleButton}
                  onPress={() => setShowInactive(!showInactive)}
                >
                  <Ionicons 
                    name={showInactive ? "people" : "trash-outline"} 
                    size={18} 
                    color="white" 
                  />
                  <Text style={styles.toggleButtonText}>
                    {showInactive ? 'Activos' : 'Inactivos'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por DNI"
                value={searchText}
                onChangeText={validarSearch}
                keyboardType="numeric"
                maxLength={8}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <TouchableOpacity style={styles.searchIcon}>
                <Ionicons name="search" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#252861" style={{ flex: 1 }} />
            ) : (
              <FlatList
                data={filteredAlumnos}
                renderItem={renderAlumnoItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                  <Text style={styles.emptyListText}>
                    {searchText 
                      ? 'No se encontraron alumnos con ese DNI.' 
                      : showInactive 
                        ? 'No hay alumnos inactivos.' 
                        : 'No hay alumnos registrados.'
                    }
                  </Text>
                }
              />
            )}
          </View>
        </KeyboardAvoidingView>

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
              <View style={[
                styles.modalDetail,
                { backgroundColor: alertType === "success" ? "#252861" : "#DB2024" }
              ]}>
                <Text style={styles.modalTitle}>{alertTitle}</Text>
              </View>
              <Text style={styles.modalMessage}>{alertMessage}</Text>
              
              <View style={styles.modalButtons}>
                {showCancelButton && (
                  <TouchableOpacity
                    style={[styles.modalButton, { borderColor: "#252861", borderWidth: 2 }]}
                    onPress={() => setShowAlert(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: "#252861" }]}>Cancelar</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { 
                      backgroundColor: alertType === "success" ? "#252861" : "#DB2024",
                      borderWidth: 0,
                      flex: showCancelButton ? 1 : 1
                    }
                  ]}
                  onPress={() => {
                    onConfirm();
                    setShowAlert(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: "#fff" }]}>Aceptar</Text>
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
    borderWidth: 1,
    borderColor: 'transparent', // Color por defecto
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
  headerActions: {
    flexDirection: 'collum',
    alignItems: 'center',
    gap: 10,
  },
  toggleButton: {
  backgroundColor: '#666',
  paddingVertical: 8,
  paddingHorizontal: 10,
  borderRadius: 8,
  flexDirection: 'row',
  alignItems: 'center',
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 5,
  },
  reactivateButton: {
    backgroundColor: '#252861', // Verde para reactivar
    flex: 1,
  },
  inactiveLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  searchContainerFocused: {
    borderColor: "#1E2A78",
    borderWidth: 2,
  },
});
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
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  increment 
} from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModificarAlumno() {
  const navigation = useNavigation();
  const route = useRoute();
  const { alumno } = route.params || {};
  
  //Validadores
  const validadorcaracteres = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
  const validadorsolonumeros = /^\d+$/;

  const validarFecha = (fecha) => {
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(fecha)) return false;
    const [dia, mes, año] = fecha.split('-').map(Number);
    const fechaObj = new Date(año, mes - 1, dia);
    return fechaObj.getDate() === dia && fechaObj.getMonth() === mes - 1 && fechaObj.getFullYear() === año;
  };

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarDNI = (dni) => {
    return dni.length >= 7 && dni.length <= 8 && /^\d+$/.test(dni);
  };

  const ValidarNumTelefono = (telefono) => {
    return telefono.length >= 8 && telefono.length <= 11;
  };

  const validarDniAlumno = (dni) => {
    if (dni === '' || validadorsolonumeros.test(dni)) {
      setDniAlumno(dni);
    }
  };

  const validarDniTutor = (dni) => {
    if (dni === '' || validadorsolonumeros.test(dni)) {
      setDniTutor(dni);
    }
  };

  const validarNombreAlumno = (nombre) => {
    if (nombre === '' || validadorcaracteres.test(nombre)) {
      setNombreAlumno(nombre);
    }
  };

  const validarApellidoAlumno = (apellido) => {
    if (apellido === '' || validadorcaracteres.test(apellido)) {
      setApellidoAlumno(apellido);
    }
  };

  const validarNombreTutor = (nombre) => {
    if (nombre === '' || validadorcaracteres.test(nombre)) {
      setNombreTutor(nombre);
    }
  };

  const validarApellidoTutor = (apellido) => {
    if (apellido === '' || validadorcaracteres.test(apellido)) {
      setApellidoTutor(apellido);
    }
  };

  const validarTelefono = (telefono) => {
    if (telefono === '' || validadorsolonumeros.test(telefono)) {
      setNumeroTelefono(telefono);
    }
  };

  //estados nuevos
  const [loading, setLoading] = useState(false);
  const [alertType, setAlertType] = useState("error");
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [dniAlumno, setDniAlumno] = useState('');
  const [dniTutor, setDniTutor] = useState('');
  const [gradoSeleccionado, setGradoSeleccionado] = useState('');
  const [grados, setGrados] = useState([]);

  // Estados editables del alumno
  const [nombreAlumno, setNombreAlumno] = useState('');
  const [apellidoAlumno, setApellidoAlumno] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estados editables del tutor
  const [nombreTutor, setNombreTutor] = useState('');
  const [apellidoTutor, setApellidoTutor] = useState('');
  const [correoTutor, setCorreoTutor] = useState('');
  const [numeroTelefono, setNumeroTelefono] = useState('');
  const [parentesco, setParentesco] = useState('Padre');

  // Función para formatear fechas
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-ES');
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

  // Estados input Focused
  const [firstNameAlumnoFocused, setFirstNameAlumnoFocused] = useState(false);
  const [firstNameTutorFocused, setFirstNameTutorFocused] = useState(false);
  const [lastNameAlumnoFocused, setLastNameAlumnoFocused] = useState(false);
  const [lastNameTutorFocused, setLastNameTutorFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [dniAlumnoFocused, setDniAlumnoFocused] = useState(false);
  const [dniTutorFocused, setDniTutorFocused] = useState(false);
  const [detailFocused, setDetailFocused] = useState(false);
  const [telefonoFocused, setTelefonoFocused] = useState(false);
  
  // --- FUNCIONES ---
  const showCustomAlert = (title, message, confirmAction, type = "error", needsCancel = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirm(() => confirmAction);
    setAlertType(type);
    setShowCancelButton(needsCancel);
    setShowAlert(true);
  };

  //guardar cambios
  const handleGuardarCambios = async () => {
    // Validación: DNI alumno y tutor no pueden ser iguales
    if (dniAlumno !== '' && dniTutor !== '' && dniAlumno === dniTutor) {
      showCustomAlert("Error", "El DNI del alumno y del tutor no pueden coincidir, inténtelo de nuevo.", () => setShowAlert(false), "error", false);
      return;
    }

    // Validaciones del Alumno
    if (!nombreAlumno.trim() || !apellidoAlumno.trim()) {
      showCustomAlert("Error", "Por favor, complete el nombre y apellido del alumno.", () => setShowAlert(false), "error", false);
      return;
    }
    
    if (!validarDNI(dniAlumno)) {
      showCustomAlert("Error", "Por favor, ingrese un DNI válido para el alumno (7-8 dígitos).", () => setShowAlert(false), "error", false);
      return;
    }

    if (!validarFecha(fechaNacimiento)) {
      showCustomAlert("Error", "Por favor, ingrese una fecha de nacimiento válida (DD-MM-AAAA).", () => setShowAlert(false), "error", false);
      return;
    }

    if (!gradoSeleccionado) {
      showCustomAlert("Error", "Por favor, seleccione un grado.", () => setShowAlert(false), "error", false);
      return;
    }
    
    // Validaciones del Tutor
    if (!nombreTutor.trim() || !apellidoTutor.trim()) {
      showCustomAlert("Error", "Por favor, complete el nombre y apellido del tutor.", () => setShowAlert(false), "error", false);
      return;
    }
    
    if (!validarDNI(dniTutor)) {
      showCustomAlert("Error", "Por favor, ingrese un DNI válido para el tutor (7-8 dígitos).", () => setShowAlert(false), "error", false);
      return;
    }
    
    if (!validarEmail(correoTutor)) {
      showCustomAlert("Error", "Por favor, ingrese un correo electrónico válido para el tutor.", () => setShowAlert(false), "error", false);
      return;
    }

    if (numeroTelefono && !ValidarNumTelefono(numeroTelefono)) {
      showCustomAlert("Error", "El número de teléfono no es válido, debe tener entre 8-11 dígitos.", () => setShowAlert(false), "error", false);
      return;
    }

    setLoading(true);

    try {
      // Verificar si otro alumno tiene el mismo DNI de alumno (excepto el actual)
      const alumnosQuery = query(
        collection(db, "alumnos"), 
        where("dni_alumno", "==", parseInt(dniAlumno))
      );
      const alumnosSnapshot = await getDocs(alumnosQuery);
      
      // Verificar que no sea el mismo alumno
      const otroAlumno = alumnosSnapshot.docs.find(doc => doc.id !== alumno.id);
      if (otroAlumno) {
        showCustomAlert("Error", "Ya existe otro alumno registrado con este DNI.", () => setShowAlert(false), "error", false);
        setLoading(false);
        return;
      }

      // NUEVA VALIDACIÓN: Verificar que el DNI del tutor no coincida con el DNI de ningún alumno
      const tutorComoAlumnoQuery = query(
        collection(db, "alumnos"), 
        where("dni_alumno", "==", parseInt(dniTutor))
      );
      const tutorComoAlumnoSnapshot = await getDocs(tutorComoAlumnoQuery);
      
      if (!tutorComoAlumnoSnapshot.empty) {
        showCustomAlert("Error", "El DNI del tutor ya se encuentra registrado en otro alumno. Por favor, verifique los datos.", () => setShowAlert(false), "error", false);
        setLoading(false);
        return;
      }

      // Verificar si cambió el grado
      const cambioGrado = alumno.id_grado !== gradoSeleccionado;
      
      // Si cambió el grado, actualizar asientos
      if (cambioGrado) {
        // Liberar asiento del grado anterior
        const gradoAnteriorRef = doc(db, "grados", alumno.id_grado);
        await updateDoc(gradoAnteriorRef, {
          asientos_disponibles: increment(1)
        });

        // Ocupar asiento del nuevo grado
        const gradoNuevoRef = doc(db, "grados", gradoSeleccionado);
        await updateDoc(gradoNuevoRef, {
          asientos_disponibles: increment(-1)
        });
      }

      // Obtener nombre del grado seleccionado
      const gradoDoc = await getDoc(doc(db, "grados", gradoSeleccionado));
      const gradoData = gradoDoc.data();

      // Convertir fecha de DD-MM-AAAA a Date
      const [dia, mes, año] = fechaNacimiento.split('-').map(Number);
      const fechaNacimientoDate = new Date(año, mes - 1, dia);

      const alumnoRef = doc(db, "alumnos", alumno.id);
      
      await updateDoc(alumnoRef, {
        dni_alumno: parseInt(dniAlumno),
        nombre_alumno: nombreAlumno.trim(),
        apellido_alumno: apellidoAlumno.trim(),
        fecha_nacimiento_alumno: fechaNacimientoDate,
        genero_alumno: genero === 'Masculino' ? 'M' : 'F',
        observaciones_alumno: observaciones.trim(),
        id_grado: gradoSeleccionado,
        nombre_grado: gradoData.nombre_grado,
        dni_tutor: parseInt(dniTutor),
        nombre_tutor: nombreTutor.trim(),
        apellido_tutor: apellidoTutor.trim(),
        correo_tutor: correoTutor.toLowerCase().trim(),
        numero_telefono: numeroTelefono.trim(),
        parentesco: parentesco,
        fecha_modificacion: new Date(),
      });

      showCustomAlert(
        "Éxito",
        "Los datos del alumno han sido actualizados correctamente.",
        () => {
          setShowAlert(false);
          navigation.goBack();
        },
        "success",
        false
      );
    } catch (error) {
      console.error("Error al actualizar alumno: ", error);
      showCustomAlert(
        "Error",
        "Ocurrió un problema al actualizar los datos. Intente nuevamente.",
        () => setShowAlert(false),
        "error",
        false
      );
    } finally {
      setLoading(false);
    }
  };

  // cargar datos iniciales:
  useEffect(() => {
    if (alumno) {
      // Cargar datos del alumno
      setNombreAlumno(alumno.nombre_alumno || '');
      setApellidoAlumno(alumno.apellido_alumno || '');
      setDniAlumno(alumno.dni_alumno ? alumno.dni_alumno.toString() : '');
      setGenero(alumno.genero_alumno === 'M' ? 'Masculino' : 'Femenino');
      setObservaciones(alumno.observaciones_alumno || '');
      setGradoSeleccionado(alumno.id_grado || '');
      
      // Cargar fecha de nacimiento
      if (alumno.fecha_nacimiento_alumno) {
        const birthDate = alumno.fecha_nacimiento_alumno.toDate ? 
          alumno.fecha_nacimiento_alumno.toDate() : 
          new Date(alumno.fecha_nacimiento_alumno);
        setDate(birthDate);
        const day = birthDate.getDate().toString().padStart(2, '0');
        const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
        const year = birthDate.getFullYear();
        setFechaNacimiento(`${day}-${month}-${year}`);
      }
      
      // Cargar datos del tutor
      setNombreTutor(alumno.nombre_tutor || '');
      setApellidoTutor(alumno.apellido_tutor || '');
      setDniTutor(alumno.dni_tutor ? alumno.dni_tutor.toString() : '');
      setCorreoTutor(alumno.correo_tutor || '');
      setNumeroTelefono(alumno.numero_telefono || '');
      setParentesco(alumno.parentesco || 'Padre');
    }
  }, [alumno]);

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
    showCustomAlert(
      "Cerrar Sesión",
      "¿Confirma que quiere cerrar sesión?",
      async () => {
        try {
          await signOut(auth);
          navigation.replace('Login');
        } catch (error) {
          showCustomAlert(
            "Error",
            "Ha ocurrido un problema al cerrar sesión.",
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
  
  //manejar el cambio de fecha
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      setFechaNacimiento(`${day}-${month}-${year}`);
    }
  };

  //carga los grados disponibles
  useEffect(() => {
    const fetchGrados = async () => {
      try {
        const q = query(
          collection(db, "grados"), 
          where("asientos_disponibles", ">", 0), 
          orderBy("año", "asc")
        );
        const querySnapshot = await getDocs(q);
        
        const gradosDisponibles = [];
        querySnapshot.forEach((doc) => {
          gradosDisponibles.push({ id: doc.id, ...doc.data() });
        });
        
        // Agregar el grado actual del alumno si no está en la lista
        if (alumno && alumno.id_grado) {
          const gradoActualExiste = gradosDisponibles.some(g => g.id === alumno.id_grado);
          if (!gradoActualExiste) {
            gradosDisponibles.push({
              id: alumno.id_grado,
              nombre_grado: alumno.nombre_grado,
              asientos_disponibles: 0
            });
          }
        }
        
        setGrados(gradosDisponibles);
      } catch (error) {
        console.error("Error al obtener los grados: ", error);
      }
    };

    fetchGrados();
  }, [alumno]);
      
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
        
        {/* KeyboardAvoidingView AQUÍ - envuelve TODO el contenido, no dentro de View */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView
            style={styles.mainContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
              {alumno ? (
                <>
                  {/* SECCIÓN ALUMNO */}
                  <Text style={styles.sectionTitle}>(Modificar) información del Alumno</Text>
                  <View style={styles.cardContainer}>
                    <Text style={styles.editLabel}>DNI *</Text>
                    <TextInput
                      style={[styles.editInput, dniAlumnoFocused && styles.inputContainerFocused]}
                      value={dniAlumno}
                      onChangeText={validarDniAlumno}
                      placeholder="Ingrese el DNI"
                      keyboardType="numeric"
                      maxLength={8}
                      onFocus={() => setDniAlumnoFocused(true)}
                      onBlur={() => setDniAlumnoFocused(false)}
                    />
                    {dniAlumno !== '' && dniTutor !== '' && dniAlumno === dniTutor && (
                      <Text style={styles.errorText}>
                        El DNI del alumno no puede ser el mismo que el del tutor.
                      </Text>
                    )}

                    <Text style={styles.editLabel}>Nombre *</Text>
                    <TextInput
                      style={[styles.editInput, firstNameAlumnoFocused && styles.inputContainerFocused]}
                      value={nombreAlumno}
                      onChangeText={validarNombreAlumno}
                      placeholder="Ingrese el nombre"
                      maxLength={35}
                      onFocus={() => setFirstNameAlumnoFocused(true)}
                      onBlur={() => setFirstNameAlumnoFocused(false)}
                    />

                    <Text style={styles.editLabel}>Apellido *</Text>
                    <TextInput
                      style={[styles.editInput, lastNameAlumnoFocused && styles.inputContainerFocused]}
                      value={apellidoAlumno}
                      onChangeText={validarApellidoAlumno}
                      placeholder="Ingrese el apellido"
                      maxLength={35}
                      onFocus={() => setLastNameAlumnoFocused(true)}
                      onBlur={() => setLastNameAlumnoFocused(false)}
                    />

                    <Text style={styles.editLabel}>Fecha de Nacimiento *</Text>
                    <TouchableOpacity 
                      onPress={() => setShowDatePicker(true)} 
                      style={styles.dateInputContainer}
                    >
                      <Text style={{ color: fechaNacimiento ? '#000' : '#999', fontSize: 14 }}>
                        {fechaNacimiento || "DD-MM-AAAA"}
                      </Text>
                      <FontAwesome name="calendar" size={18} color="#666" />
                    </TouchableOpacity>

                    <Text style={styles.editLabel}>Género *</Text>
                    <View style={styles.genderContainer}>
                      <TouchableOpacity 
                        style={styles.checkboxWrapper} 
                        onPress={() => setGenero('Masculino')}
                      >
                        <View style={[styles.checkbox, genero === 'Masculino' && styles.checkboxSelected]}>
                          {genero === 'Masculino' && <Ionicons name="checkmark" size={16} color="white" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Masculino</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.checkboxWrapper} 
                        onPress={() => setGenero('Femenino')}
                      >
                        <View style={[styles.checkbox, genero === 'Femenino' && styles.checkboxSelected]}>
                          {genero === 'Femenino' && <Ionicons name="checkmark" size={16} color="white" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Femenino</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.editLabel}>Grado *</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={gradoSeleccionado}
                        onValueChange={(itemValue) => setGradoSeleccionado(itemValue)}
                        style={styles.picker}
                        dropdownIconColor="#252861"
                        enabled={grados.length > 0}
                      >
                        <Picker.Item label="Seleccione un grado..." value="" />
                        {grados.map((grado) => (
                          <Picker.Item 
                            key={grado.id} 
                            label={`${grado.nombre_grado} (${grado.asientos_disponibles} asientos)`} 
                            value={grado.id} 
                          />
                        ))}
                      </Picker>
                    </View>

                    <Text style={styles.editLabel}>Observaciones</Text>
                    <TextInput
                      style={[styles.editInput, styles.textArea, detailFocused && styles.inputContainerFocused]}
                      value={observaciones}
                      onChangeText={setObservaciones}
                      placeholder="Ingrese observaciones"
                      maxLength={250}
                      multiline
                      numberOfLines={3}
                      onFocus={() => setDetailFocused(true)}
                      onBlur={() => setDetailFocused(false)}
                    />
                  </View>

                  {/* SECCIÓN TUTOR */}
                  <Text style={styles.sectionTitle}>(Modificar) información del Tutor</Text>
                  <View style={styles.cardContainer}>
                    <Text style={styles.editLabel}>DNI *</Text>
                    <TextInput
                      style={[styles.editInput, dniTutorFocused && styles.inputContainerFocused]}
                      value={dniTutor}
                      onChangeText={validarDniTutor}
                      placeholder="Ingrese el DNI"
                      keyboardType="numeric"
                      maxLength={8}
                      onFocus={() => setDniTutorFocused(true)}
                      onBlur={() => setDniTutorFocused(false)}
                    />

                    <Text style={styles.editLabel}>Parentesco *</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={parentesco}
                        onValueChange={(itemValue) => setParentesco(itemValue)}
                        style={styles.picker}
                        dropdownIconColor="#252861"
                      >
                        <Picker.Item label="Padre" value="Padre" />
                        <Picker.Item label="Madre" value="Madre" />
                        <Picker.Item label="Tutor Legal" value="Tutor Legal" />
                        <Picker.Item label="Abuelo" value="Abuelo" />
                        <Picker.Item label="Abuela" value="Abuela" />
                        <Picker.Item label="Tío" value="Tío" />
                        <Picker.Item label="Tía Legal" value="Tía" />
                      </Picker>
                    </View>

                    <Text style={styles.editLabel}>Nombre *</Text>
                    <TextInput
                      style={[styles.editInput, firstNameTutorFocused && styles.inputContainerFocused]}
                      value={nombreTutor}
                      onChangeText={validarNombreTutor}
                      placeholder="Ingrese el nombre"
                      maxLength={35}
                      onFocus={() => setFirstNameTutorFocused(true)}
                      onBlur={() => setFirstNameTutorFocused(false)}
                    />

                    <Text style={styles.editLabel}>Apellido *</Text>
                    <TextInput
                      style={[styles.editInput, lastNameTutorFocused && styles.inputContainerFocused]}
                      value={apellidoTutor}
                      onChangeText={validarApellidoTutor}
                      placeholder="Ingrese el apellido"
                      maxLength={35}
                      onFocus={() => setLastNameTutorFocused(true)}
                      onBlur={() => setLastNameTutorFocused(false)}
                    />

                    <Text style={styles.editLabel}>Correo *</Text>
                    <TextInput
                      style={[styles.editInput, emailFocused && styles.inputContainerFocused]}
                      value={correoTutor}
                      onChangeText={setCorreoTutor}
                      placeholder="Ingrese el correo"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      maxLength={100}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />

                    <Text style={styles.editLabel}>Teléfono</Text>
                    <TextInput
                      style={[styles.editInput, telefonoFocused && styles.inputContainerFocused]}
                      value={numeroTelefono}
                      onChangeText={validarTelefono}
                      placeholder="Ingrese el teléfono"
                      keyboardType="numeric"
                      maxLength={15}
                      onFocus={() => setTelefonoFocused(true)}
                      onBlur={() => setTelefonoFocused(false)}
                    />
                  </View>

                  {/* BOTONES DE ACCIÓN */}
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.cancelButton]} 
                      onPress={() => navigation.goBack()}
                      disabled={loading}
                    >
                      <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                        CANCELAR
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.confirmButton]} 
                      onPress={handleGuardarCambios}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={[styles.actionButtonText, styles.confirmButtonText]}>
                          GUARDAR
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>No se encontraron detalles del alumno.</Text>
              )}
            </View>

            {/* DatePicker dentro del ScrollView */}
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
            )}
          </ScrollView>
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
  keyboardAvoidingView: {
    flex: 1,
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
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  editLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  editInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  disabledInput: {
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  disabledText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#252861',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#252861',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  picker: {
    height: 50,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#C81B1E',
  },
  confirmButton: {
    backgroundColor: '#252861',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#C81B1E',
  },
  confirmButtonText: {
    color: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  errorText: {
    color: '#DC3545',
    fontSize: 12,
    marginTop: -5,
    marginBottom: 10,
  },
  inputContainerFocused: {
    borderColor: "#1E2A78",
    borderWidth: 2,
  },
});
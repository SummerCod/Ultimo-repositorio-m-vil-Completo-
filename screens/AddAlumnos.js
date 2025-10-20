import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  Modal,
  Animated,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../src/config/firebaseConfig';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

export default function AddAlumnos() {
  const navigation = useNavigation();

  // Estado para el modal de la imagen y carga
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Datos del Alumno
  const [nombreAlumno, setNombreAlumno] = useState('');
  const [apellidoAlumno, setApellidoAlumno] = useState('');
  const [dniAlumno, setDniAlumno] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [observaciones, setObservaciones] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Estados para el enfoque de los campos
  const [firstNameAlumnoFocused, setFirstNameAlumnoFocused] = useState(false);
  const [firstNameTutorFocused, setFirstNameTutorFocused] = useState(false);
  const [lastNameAlumnoFocused, setLastNameAlumnoFocused] = useState(false);
  const [lastNameTutorFocused, setLastNameTutorFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [dniAlumnoFocused, setDniAlumnoFocused] = useState(false);
  const [dniTutorFocused, setDniTutorFocused] = useState(false);
  const [detailFocused, setDetailFocused] = useState(false);
  const [telefonoFocused, setTelefonoFocused] = useState(false);

  // Estados para manejar los grados
  const [gradoSeleccionado, setGradoSeleccionado] = useState('');
  const [grados, setGrados] = useState([]);

  // Datos del Tutor
  const [nombreTutor, setNombreTutor] = useState('');
  const [apellidoTutor, setApellidoTutor] = useState('');
  const [dniTutor, setDniTutor] = useState('');
  const [correoTutor, setCorreoTutor] = useState('');
  const [parentesco, setParentesco] = useState('Padre');
  const [numeroTelefono, setNumeroTelefono] = useState('');

  // Estados de la UI
  const [menuVisible, setMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertType, setAlertType] = useState("error");
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const isFocused = useIsFocused();
  const [imageUri, setImageUri] = useState(null);
  const [showCancelButton, setShowCancelButton] = useState(false);

  // --- FUNCIONES DE VALIDACIÓN ---
  const validadorcaracteres = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+$/;
  const validadorsolonumeros = /^\d+$/

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
    return telefono.length >=8 && telefono.length <= 11;
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

  const validarTelefono = (telefono) => {
    if (telefono === '' || validadorsolonumeros.test(telefono)) {
      setNumeroTelefono(telefono);
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

  const limpiarFormulario = () => {
    setNombreAlumno('');
    setApellidoAlumno('');
    setDniAlumno('');
    setFechaNacimiento('');
    setGenero('Masculino');
    setObservaciones('');
    setGradoSeleccionado('');
    setNombreTutor('');
    setApellidoTutor('');
    setDniTutor('');
    setCorreoTutor('');
    setParentesco('Padre');
    setNumeroTelefono('');
  };

  //  FUNCIÓN PRINCIPAL PARA REGISTRAR ALUMNO 
  const handleRegistrarAlumno = async () => {
    const user = auth.currentUser;
    if (!user) {
      showCustomAlert("Error de Autenticación", "Debes iniciar sesión para registrar un alumno.", () => setShowAlert(false));
      return;
    }

    // Validaciones del Alumno
    if (dniAlumno !== '' && dniTutor !== '' && dniAlumno === dniTutor) {
      showCustomAlert("Error", "El dni del alumno y del tutor no pueden coincidir, intentelo de nuevo.", () => setShowAlert(false));
      return
    }
    if (!nombreAlumno.trim() || !apellidoAlumno.trim()) {
      showCustomAlert("Error", "Por favor, complete el nombre y apellido del alumno.", () => setShowAlert(false));
      return;
    }
    if (!validarDNI(dniAlumno)) {
      showCustomAlert("Error", "Por favor, ingrese un DNI válido para el alumno (7-8 dígitos).", () => setShowAlert(false));
      return;
    }
    if (!validarFecha(fechaNacimiento)) {
      showCustomAlert("Error", "Por favor, ingrese una fecha de nacimiento válida (DD-MM-AAAA).", () => setShowAlert(false));
      return;
    }
    if (!gradoSeleccionado) {
      showCustomAlert("Error", "Por favor, seleccione un grado.", () => setShowAlert(false));
      return;
    }

    // Validaciones del Tutor
    if (!nombreTutor.trim() || !apellidoTutor.trim()) {
      showCustomAlert("Error", "Por favor, complete el nombre y apellido del tutor.", () => setShowAlert(false));
      return;
    }
    if (!validarDNI(dniTutor)) {
      showCustomAlert("Error", "Por favor, ingrese un DNI válido para el tutor (7-8 dígitos).", () => setShowAlert(false));
      return;
    }
    if (!validarEmail(correoTutor)) {
      showCustomAlert("Error", "Por favor, ingrese un correo electrónico válido para el tutor.", () => setShowAlert(false));
      return;
    }
    if (!ValidarNumTelefono(numeroTelefono)) {
      showCustomAlert("Error", "El numero de telefono no es valido, debe tener entre (8-11 digitos).", () => setShowAlert(false));
      return;
    }


    setLoading(true);

    try {
      const alumnosQuery = query(collection(db, "alumnos"), where("dni_alumno", "==", parseInt(dniAlumno)));
      const alumnosSnapshot = await getDocs(alumnosQuery);
      if (!alumnosSnapshot.empty) {
        showCustomAlert("Error", "Ya existe un alumno registrado con este DNI.", () => setShowAlert(false));
        setLoading(false);
        return;
      }

      //  Verificar que el DNI del tutor no coincida con el DNI de ningún alumno
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

      const gradoDoc = await getDoc(doc(db, "grados", gradoSeleccionado));
      const gradoData = gradoDoc.data();

      const [dia, mes, año] = fechaNacimiento.split('-').map(Number);
      const fechaNacimientoDate = new Date(año, mes - 1, dia);

      const nuevoAlumno = {
        dni_alumno: dniAlumno,
        nombre_alumno: nombreAlumno.trim(),
        apellido_alumno: apellidoAlumno.trim(),
        fecha_nacimiento_alumno: fechaNacimientoDate,
        genero_alumno: genero === 'Masculino' ? 'M' : 'F',
        observaciones_alumno: observaciones.trim() || '',
        estado_alumno: true,
        id_grado: gradoSeleccionado,
        nombre_grado: gradoData.nombre_grado,
        dni_tutor: dniTutor,
        nombre_tutor: nombreTutor.trim(),
        apellido_tutor: apellidoTutor.trim(),
        correo_tutor: correoTutor.toLowerCase().trim(),
        parentesco: parentesco,
        fecha_inscripcion: new Date(),
        numero_telefono: numeroTelefono.trim(),
      };

      await addDoc(collection(db, "alumnos"), nuevoAlumno);

      const gradoRef = doc(db, "grados", gradoSeleccionado);
      await updateDoc(gradoRef, {
        asientos_disponibles: increment(-1)
      });

      showCustomAlert("Éxito", "El alumno ha sido registrado correctamente.", () => {
        setShowAlert(false);
        limpiarFormulario();
        navigation.goBack();
      }, "success");

    } catch (error) {
      console.error("Error al registrar alumno: ", error);
      showCustomAlert("Error", "Ocurrió un problema al registrar el alumno. Intente nuevamente.", () => setShowAlert(false));
    } finally {
      setLoading(false);
    }
  };

  const showCustomAlert = (title, message, confirmAction, type = "error", needsCancel = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirm(() => confirmAction);
    setAlertType(type);
    setShowCancelButton(needsCancel); // Nuevo parámetro
    setShowAlert(true);
  };
    
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
      true // SÍ necesita cancelar
    );
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
        }
      } else {
        navigation.replace('Login');
      }
    };
  
    if (isFocused) {
      fetchUserData();
    }
  }, [isFocused]);
  
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
  
  useFocusEffect(
    useCallback(() => {
      const fetchGrados = async () => {
        try {
          const q = query(collection(db, "grados"), where("asientos_disponibles", ">", 0), orderBy("año", "asc"));
          const querySnapshot = await getDocs(q);
          
          const gradosDisponibles = [];
          querySnapshot.forEach((doc) => {
            gradosDisponibles.push({ id: doc.id, ...doc.data() });
          });
          
          setGrados(gradosDisponibles);
        } catch (error) {
          console.error("Error al obtener los grados: ", error);
          showCustomAlert("Error", "No se pudieron cargar los grados disponibles.", () => setShowAlert(false));
        }
      };

      fetchGrados();
    }, [])
  );

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentDate = selectedDate;
      setDate(currentDate);

      let tempDate = new Date(currentDate);
      let day = tempDate.getDate().toString().padStart(2, '0');
      let month = (tempDate.getMonth() + 1).toString().padStart(2, '0');
      let year = tempDate.getFullYear();
      setFechaNacimiento(`${day}-${month}-${year}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ImageBackground
        source={require('../assets/background.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('../assets/piaget-icon.png')} style={styles.logo} />
            <View>
              <Text style={styles.headerTitle}>
                Instituto{"\n"}Jean Piaget <Text style={styles.headerNumber}>N°8048</Text>
              </Text>
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

        {/* Menú */}
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
        
        {/* NAVEGACIÓN SUPERIOR */}
        <View style={styles.topNav}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
              <FontAwesome name="arrow-left" size={25} color="#031666ff" style={styles.backIcon} />
              <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>

        {/* KeyboardAvoidingView envuelve el ScrollView */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Registro Alumno</Text>

              {/* SECCIÓN DATOS DEL ALUMNO */}
              <Text style={styles.label}>Nombre:</Text>
              <TextInput style={[styles.input, firstNameAlumnoFocused && styles.inputContainerFocused]} 
              placeholder="Ingrese el nombre" 
              value={nombreAlumno} 
              onChangeText={validarNombreAlumno} 
              maxLength={35} 
              onFocus={() => setFirstNameAlumnoFocused(true)}
              onBlur={() => setFirstNameAlumnoFocused(false)} />
              
              <Text style={styles.label}>Apellido:</Text>
              <TextInput style={[styles.input, lastNameAlumnoFocused && styles.inputContainerFocused]} 
              placeholder="Ingrese el apellido" 
              value={apellidoAlumno} 
              onChangeText={validarApellidoAlumno} 
              maxLength={35}
              onFocus={() => setLastNameAlumnoFocused(true)}
              onBlur={() => setLastNameAlumnoFocused(false)} />
              
              <Text style={styles.label}>DNI:</Text>
              <TextInput style={[styles.input, dniAlumnoFocused && styles.inputContainerFocused]} 
              placeholder="Ingrese el DNI" 
              keyboardType="numeric" 
              value={dniAlumno} 
              onChangeText={validarDniAlumno} 
              maxLength={8}
              onFocus={() => setDniAlumnoFocused(true)}
              onBlur={() => setDniAlumnoFocused(false)} />
              {dniAlumno !== '' && dniTutor !== '' && dniAlumno === dniTutor && (
                <Text  style={styles.errorText}>
                  El DNI del alumno no puede ser el mismo que el del tutor.
                </Text>
              )}
              <Text style={styles.label}>Fecha de nacimiento:</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputContainer}>
                <Text style={[styles.dateInput, { color: fechaNacimiento ? '#000' : '#999' }]}>
                  {fechaNacimiento || "DD-MM-AAAA"}
                </Text>
                <FontAwesome name="calendar" size={20} color="#666" />
              </TouchableOpacity>
              
              <Text style={styles.label}>Género:</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setGenero('Masculino')}>
                  <View style={[styles.checkbox, genero === 'Masculino' && styles.checkboxSelected]}>
                    {genero === 'Masculino' && <Ionicons name="checkmark" size={18} color="white" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Masculino</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setGenero('Femenino')}>
                  <View style={[styles.checkbox, genero === 'Femenino' && styles.checkboxSelected]}>
                    {genero === 'Femenino' && <Ionicons name="checkmark" size={18} color="white" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Femenino</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Grado:</Text>
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
                    <Picker.Item key={grado.id} label={`${grado.nombre_grado} (${grado.asientos_disponibles} asientos)`} value={grado.id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Observaciones (opcional):</Text>
              <TextInput 
                style={[styles.input, styles.textArea, detailFocused && styles.inputContainerFocused]} 
                placeholder="Ingrese observaciones" 
                value={observaciones} 
                onChangeText={setObservaciones}
                maxLength={100}
                multiline
                numberOfLines={3}
                onFocus={() => setDetailFocused(true)}
                onBlur={() => setDetailFocused(false)}
              />

              {/* SECCIÓN DATOS DEL TUTOR */}
              <View style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Datos del Tutor</Text>
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
              </View>

              <Text style={styles.label}>Nombre:</Text>
              <TextInput style={[styles.input, firstNameTutorFocused && styles.inputContainerFocused]} 
              placeholder="Ingrese el nombre" 
              value={nombreTutor} 
              onChangeText={validarNombreTutor} 
              maxLength={35}
              onFocus={() => setFirstNameTutorFocused(true)}
              onBlur={() => setFirstNameTutorFocused(false)} />
              
              <Text style={styles.label}>Apellido:</Text>
              <TextInput style={[styles.input, lastNameTutorFocused && styles.inputContainerFocused]} 
              placeholder="Ingrese el apellido" 
              value={apellidoTutor} 
              onChangeText={validarApellidoTutor} 
              maxLength={35}
              onFocus={() => setLastNameTutorFocused(true)}
              onBlur={() => setLastNameTutorFocused(false)} />
              
              <Text style={styles.label}>DNI:</Text>
              <TextInput style={[styles.input, dniTutorFocused && styles.inputContainerFocused]} 
              placeholder="Ingrese el DNI" 
              keyboardType="numeric" 
              value={dniTutor} 
              onChangeText={validarDniTutor} 
              maxLength={8}
              onFocus={() => setDniTutorFocused(true)}
              onBlur={() => setDniTutorFocused(false)} />
              {dniAlumno !== '' && dniTutor !== '' && dniAlumno === dniTutor && (
                <Text  style={styles.errorText}>
                  El DNI del tutor no puede ser el mismo que el del alumno.
                </Text>
              )}
              <Text style={styles.label}>Correo:</Text>
              <TextInput style={[styles.input, emailFocused && styles.inputContainerFocused]} 
              placeholder="Ingrese el correo" 
              keyboardType="email-address" 
              autoCapitalize="none" 
              value={correoTutor} 
              onChangeText={setCorreoTutor} 
              maxLength={100}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)} />

              <Text style={styles.label}>Telefono:</Text>
              <TextInput style={[styles.input, telefonoFocused && styles.inputContainerFocused]} 
              placeholder="Ingrese el telefono" 
              keyboardType="numeric" 
              autoCapitalize="none" 
              value={numeroTelefono} 
              onChangeText={validarTelefono} 
              maxLength={11}
              onFocus={() => setTelefonoFocused(true)}
              onBlur={() => setTelefonoFocused(false)} />
              

              {/* BOTONES DE ACCIÓN */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => navigation.goBack()} disabled={loading}>
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.confirmButton]} 
                  onPress={handleRegistrarAlumno}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.actionButtonText, styles.confirmButtonText]}>CONFIRMAR</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* DatePicker FUERA del ScrollView */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}

        {/* Modal de Alertas */}
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
                    <Text style={[styles.modalButtonText, { color: "#fff"}]}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>


        {/* Modal imagen de perfil */}
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#C81B1E",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerRight: { flexDirection: "row", alignItems: "center" },
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
    fontSize: 13 
  },
  menuIcon: { 
    paddingTop: 28 
  },
  iconPlacing: { 
    padding: 7.6, 
    flexDirection: 'row' 
  },
  tutorIconBackground: {
    backgroundColor: '#fff', 
    width: 45.3, 
    height: 45.3, 
    borderRadius: 70,
  },
  topNav: {
    flexDirection: 'row',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 5,
    marginHorizontal:10,
    marginVertical:10,
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#031666ff',
    marginLeft: 8,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 60,
  },
  formContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#252861',
    textAlign: 'center',
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f2f5',
    paddingBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dateInput: {
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#252861',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#252861',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  divider: {
    height: 2,
    backgroundColor: '#f0f2f5',
    marginVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#252861',
    textDecorationLine: 'underline',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
    flex: 0.8,
  },
  picker: {
    height: 50,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
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
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '400',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    paddingBottom: 3,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    padding: 20,
    color: '#333',
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
  errorText: {
  color: '#C81B1E', 
  fontSize: 14,
  marginTop: -10, 
  marginBottom: 15,
  textAlign: 'left',
  paddingLeft: 5,
  },
  inputContainerFocused: {
    borderColor: "#1E2A78",
    borderWidth: 2,
  },
});
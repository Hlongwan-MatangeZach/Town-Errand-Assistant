
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import AddCard from "../../components/wallet/addCard";
import Navigation from "../../components/navigation";
import theme, { themes } from '@/constants/theme';


type Card = {
  id: string;
  storeName?: string;
  cardName?: string;
  barcode?: string;
  color?: string;
  image?: string | null;
  createdAt?: string;
};

export default function MyCardsScrreen(){

    const [scanning,setScanning]= useState(false);
    const [scanEnableed, setScanEnabled]= useState(true);
    const [cards, setCards] = useState<Card[]>([]);
    const [scannedBarCode,setScannedBarCode]=useState('');
    const [manualModal,setManualModal]= useState(false);


    const addCardManually=(card:Partial<Card>)=>{
        const newCard:Card={
            ...card,
            id: card.id || Date.now().toString(),
            createdAt:card.createdAt || new Date().toISOString(),
        } as Card;
        setCards(prev => [...prev, newCard]);
        setScannedBarCode('');
    };
    const handleScanBarcode=()=>{
        setScanning(true);
        setManualModal(false);
    };
    const handleCloseManualModal=()=>{
        setManualModal(false);
        
    };
    // `hasCards` should reflect whether we currently have any stored cards.
    // The previous implementation mistakenly used the component name instead of the
    // `cards` array, causing it to always be false and hiding the UI.  We'll
    // compute it from `cards.length` and update the render logic accordingly.
    const hasCards = cards.length > 0;

    return(
        <GestureHandlerRootView style={{flex:1}}>
            <View style={styles.container}>
                <StatusBar barStyle='dark-content'  backgroundColor={themes.light.colors.background}/>
                <View style={{flex:1}}>

                    {/*Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.tittle}>My Cards</Text>
                            <Text style={styles.subtittle}>
                                {cards.length} card{cards.length !==1 ? 's': ''} saved
                            </Text>
                        </View>

                        <View style={styles.headerActions}>
                            {hasCards && (
                                <Pressable style={styles.iconBtnGost}>
                                    <Ionicons name='trash-outline' size={20} color={themes.light.colors.danger}/>

                                </Pressable>
                            )}

                            <Pressable style={styles.headerBtnPrimary}>
                                <Ionicons name='scan' size={20} color={themes.light.colors.surface}/>

                            </Pressable>
                            <Pressable  style={styles.headerBtnSecondary}>
                                <Ionicons name='add' size={20}  color={themes.light.colors.primary}/>

                            </Pressable>
                        </View>
                    </View>

                    {/*Empty state */}
                    <View style={{flex:1}}>
                        {!hasCards ? (
                            <View style={styles.emptyWrapper}>
                                <View style={styles.emptyIconWrapper}>
                                    <MaterialIcons name='add-card' size={48} color={themes.light.colors.primary}/>
                                </View>
                                <Text style={styles.emptyTittle}>No cards yet</Text>
                                <Text style={styles.emptyDiscription}>Your digital wallet is empty. Scan a loyalty card or add one manually to get started.</Text>

                                <Pressable style={styles.ctaBtn}>
                                    <Ionicons name='scan-outline' size={20} color={themes.light.colors.surface}/>
                                    <Text style={styles.ctaBtnText}>Scan First Card</Text>
                                </Pressable>

                                <Pressable style={styles.secondaryCta} onPress={() => setManualModal(true)}>
                                    <Text style={styles.secondaryCtaText}>Enter details manually</Text>
                                </Pressable>
                            </View>
                        ) : (
                            // placeholder for future card list rendering

                        )}
                    </View>


                    <Navigation/>
                </View>
            </View>
        </GestureHandlerRootView>
    );
}

const styles=StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:themes.light.colors.background,
    },
    header:{
        paddingHorizontal:20,
        paddingVertical:29,
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        backgroundColor:themes.light.colors.background,
    },
    tittle:{
        fontSize:28,
        fontWeight:'800',
        color: themes.light.colors.text,
        letterSpacing:-0.5,
    },
    subtittle:{
        fontSize:14,
        color:themes.light.colors.textSecondary,
        marginTop:2,
        fontWeight:'500',
    },
    headerActions:{
        flexDirection:'row',
        alignItems:'center',
        gap:12,
    },
    headerBtnPrimary: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: themes.light.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: themes.light.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    headerBtnSecondary: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: themes.light.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    iconBtnGost: {
        padding: 8,
    },
    emptyWrapper:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        paddingHorizontal:40,
        marginTop:-100,
    },
    emptyIconWrapper:{
        width:100,
        height:100,
        borderRadius:50,
        backgroundColor:'#DBEAFE',
        justifyContent:'center',
        alignItems:'center',
        marginBottom:24,    
    },
    emptyTittle:{
        fontSize:22,
        fontWeight:'700',
        color:themes.light.colors.text,
        marginBottom:12,
    },
    emptyDiscription:{
        fontSize:15,
        textAlign:'center',
        lineHeight:22,
        color:themes.light.colors.textSecondary,
        marginBottom:32,
    },
    ctaBtn:{
        flexDirection:'row',
        alignItems:'center',
        gap:8,
        backgroundColor:themes.light.colors.primary,
        paddingHorizontal:32,
        paddingVertical:14,
        borderRadius:30,
        shadowColor: themes.light.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    ctaBtnText:{
        fontSize:16,
        fontWeight:'700',
        color:themes.light.colors.surface,
    },
    secondaryCta:{
        marginTop:20,
        padding:10,
    },
    secondaryCtaText:{
        fontSize:16,
        fontWeight:'600',
        color:themes.light.colors.primary,
    },


}

)
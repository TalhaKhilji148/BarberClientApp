import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import RNFS from 'react-native-fs'; 
import axios from 'axios';
import {SvgXml} from 'react-native-svg';
import {plusIcon} from './Photos/Button.js';
import { frame } from './Photos/Frame.js';
import VideoPlayer from 'react-native-video-player';





export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [backendImageData, setBackendImageData] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [selectedEditedImage, setSelectedEditedImage] = useState(false);
  const [selectedHairstyle, setSelectedHairstyle] = useState(null); 
  const [edition, setEdition] = useState(null); 
  const [taskStatus, setTaskStatus] = useState(0); // Task status: 0 - Queued, 1 - Processing, 2 - Completed
  const [retryCount, setRetryCount] = useState(0);

  // Construct the YouTube video URL

  const hairstyles = [
    { id: 1, imageUrl: "https://ai-resource.ailabtools.com/hairstyle-changer-pro/doc/ResultImage-hairstyle-1-BuzzCut-2.webp", hair_style: "BuzzCut" },
    { id: 2, imageUrl: "https://ai-resource.ailabtools.com/hairstyle-changer-pro/doc/ResultImage-hairstyle-1-UnderCut-2.webp", hair_style: "UnderCut" },
    { id: 3, imageUrl: "https://ai-resource.ailabtools.com/hairstyle-changer-pro/doc/ResultImage-hairstyle-1-Pompadour-2.webp", hair_style: "Pompadour" },
    { id: 4, imageUrl: "https://ai-resource.ailabtools.com/hairstyle-changer-pro/doc/ResultImage-hairstyle-1-SlickBack-2.webp", hair_style: "SlickBack" },
    { id: 5, imageUrl: "https://ai-resource.ailabtools.com/hairstyle-changer-pro/doc/ResultImage-hairstyle-1-CurlyShag-2.webp", hair_style: "CurlyShag" },
    { id: 6, imageUrl: "https://ai-resource.ailabtools.com/hairstyle-changer-pro/doc/ResultImage-hairstyle-1-WavyShag-2.webp", hair_style: "WavyShag" },
    { id: 7, imageUrl: "https://ai-resource.ailabtools.com/hairstyle-changer-pro/doc/ResultImage-hairstyle-1-FauxHawk-2.webp", hair_style: "FauxHawk" }
  ];

  useEffect(() => {
    if (selectedHairstyle && selectedImage) {
      sendImageToBackend(selectedImage);
    }
  }, [selectedHairstyle, selectedImage]);

  useEffect(() => {
    if (taskId) {
      getImageByTaskId(taskId);
      // retryFetchingImage();
    }
  }, [taskId]);

  const openGallery = () => {
    const options = {
      mediaType: 'image/jpeg',
      includeBase64: true,
    };
    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User canceled');
      } else if (response.errorCode) {
        console.log(response.errorCode, 'err ');
      } else {
        const selectedUri = response.assets[0].uri;
        setSelectedImage(selectedUri);
        setSelectedEditedImage(false); 
      }
    });
  };

 // Inside the sendImageToBackend function
const sendImageToBackend = async (imageUri) => {
  try {
    const imageBinary = await RNFS.readFile(imageUri, 'base64');
    const response = await axios.post(
      'http://192.168.0.114:3000/images/upload',
      { image: imageBinary, hairstyleType: selectedHairstyle },
      {
        headers: {
          'ailabapi-api-key': 'kg6HXiVYqYSqM45wLKraDPIkIml2wBPNOFsW8KcJMTyXn7rDjduAUGyvtzpmE0GN',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('response upload', response.data.task);
    setTaskId(response.data.task);
    setBackendImageData(response.data.image);
    setSelectedEditedImage(true);

    if(edition){
      // Save the edited image to the device memory
    const editedImagePath = `${RNFS.DocumentDirectoryPath}/edited_image.jpg`;
    await RNFS.writeFile(editedImagePath, response.data.image, 'base64');
    console.log('Edited image saved at:', editedImagePath);
    }
  } catch (error) {
    console.error('Error sending image to backend:', error);
  }
};

  const getImageByTaskId = async (taskId) => {
    try {
      const apiKey = "kg6HXiVYqYSqM45wLKraDPIkIml2wBPNOFsW8KcJMTyXn7rDjduAUGyvtzpmE0GN";
      const response = await axios.get(`https://www.ailabapi.com/api/common/query-async-task-result?task_id=${taskId}`, {
        headers: {
          "ailabapi-api-key": apiKey,
        }
      });

      console.log('API Response:', response.data);

      if (response.data.task_status === 2 && response.data.error_code === 0) {
        const imageUrl = response.data.data.images[0];
        console.log('Image URL:', imageUrl);
        setEdition(imageUrl);
        return;
      } else {
        setTimeout(() => {
          getImageByTaskId(taskId);
        }, 5000);
      }
    } catch (error) {
      console.error('Error fetching image from backend:', error);
      setTimeout(() => {
        getImageByTaskId(taskId);
      }, 5000);
    }
  };

  const renderSelectedImage = () => {
    if (selectedEditedImage && edition) {
      return (
        <Image
          source={{ uri: edition }}
          style={styles.image}
        />
      );
    } else if (!selectedEditedImage && selectedImage) {
      return (
        <Image
          source={{ uri: selectedImage }}
          style={styles.image}
        />
      );
    } 
     else if (selectedImage == null) {
      return (
        <View>
          <Text style = {{fontWeight:"bold", fontSize:35, marginTop:20, color:"red"}}>Virtual Try On</Text>
       <VideoPlayer
    video={ require('./Photos/mahVid.mp4') }
    videoWidth={6200}
    videoHeight={6900}
     resizeMode="contain"
     style={{marginTop: 620, alignSelf:"center"}}
  repeat
  autoplay
    thumbnail={ require('./Photos/neww.webp') }
/>
          <TouchableOpacity style={[styles.button, { marginRight: 10,marginTop:20, alignSelf:"center" }]} onPress={() => openGallery()}>
      <Text style={styles.buttonText}>Select Image</Text>
    </TouchableOpacity>
                        <Text style = {{color:"red", alignSelf:"center", marginBottom:-130, marginTop:70,fontStyle:"normal", fontWeight:"bold", fontSize:17}}>No image uploaded Yet!</Text>

          <SvgXml
              xml={frame}
              style={{marginTop: 30, alignSelf:"center"}}></SvgXml>
        </View>
      );
    } 
    else {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="black" />
          <Text style={styles.loadingText}>Processing image...</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
     {selectedImage && (
  <View style={{ flexDirection: "row", marginTop: 20 }}>
    <TouchableOpacity style={[styles.button, { marginRight: 10 }]} onPress={() => setSelectedEditedImage(false)}>
      <Text style={styles.buttonText}>Original Image</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.button, { marginRight: 10 }]} onPress={() => setSelectedEditedImage(true)}>
      <Text style={styles.buttonText}>Edited Image</Text>
    </TouchableOpacity>
  </View>
)}

        {selectedImage &&(
          <TouchableOpacity onPress={() => openGallery()}>
        <SvgXml
              xml={plusIcon}
              style={{marginTop: -10, alignSelf:"center",marginBottom:-13}}></SvgXml>
       </TouchableOpacity>
     
        )}
      {/* <TouchableOpacity style={{ backgroundColor: "skyblue", borderRadius: 100, width: 30, height: 30 }} onPress={() => openGallery()}>
        <Text style={{ fontSize: 18, borderRadius: 100, width: 20, alignSelf: "center", paddingLeft: 5, marginTop: 2, fontWeight: "bold" }}>+</Text>
      </TouchableOpacity> */}
      {renderSelectedImage()}
     <View style={{ flex: 1 }}>
  
    <ScrollView horizontal={true} style={{ marginLeft: -160, position: 'absolute', bottom: 20 }}>
      {hairstyles.map((hairstyle) => (
        <TouchableOpacity 
          key={hairstyle.id} 
          style={{ marginLeft: 10 }}
          onPress={() => setSelectedHairstyle(hairstyle.hair_style)}
        >
          <Image
            source={{ uri: hairstyle.imageUrl }}
            style={{ height: 100, width: 100, borderRadius: 5 }}
          />
          <Text style={{ color: "black", alignSelf: "center", marginTop: 10, fontWeight: "bold" }}>{hairstyle.hair_style}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  
</View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#5936B4',
    height: 40,
    width: 120,
    paddingTop: 10,
    paddingLeft: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingRight: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
    marginTop: 20,
  },
  image: {
    width: 300,
    height: 450,
    resizeMode: 'cover',
    marginBottom: 40,
    borderRadius: 10,
    backgroundColor: 'lightgrey',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { FlatList, View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, ScrollView } from "react-native";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import ChatListItem from "./ChatListItem";
import notifee, { EventType } from "@notifee/react-native";

const Separator = () => <View style={styles.separator} />;

const ChatList = ({ isGroup, onPress, itemToRemove }) => {
  const navigation = useNavigation();
  const { userToken, walletAddress, messageItem, setMessageItem, setChats, chats, bool, setGChats, GChats } = useAuth();
  const [GroupUser, setGroupUser] = useState([]);
  const [coustomStyle, setCoustomStyle] = useState({});
  useEffect(() => {
    startup();
  }, []);
  const startup = async () => {
    let tmpData = await AsyncStorage.getItem("chats");
    tmpData = JSON.parse(tmpData);
    setChats(tmpData);
  };

  const shortenHex = (hex) => {
    const shortenedHex = hex.substring(0, 8) + "..." + hex.substring(hex.length - 8);
    return shortenedHex;
  };

  function shortenString(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength).concat("...");
  }

  const formatDate = (date) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };

    return new Intl.DateTimeFormat("en-US", options).format(new Date(date));
  };

  useEffect(() => {
    if (userToken) socketImplement();
  }, [userToken]);

  async function onDisplayNotification(data) {
    // Request permissions (required for iOS)
    await notifee.requestPermission();

    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
    });

    // Display a notification
    await notifee.displayNotification({
      title: data?.from_user,
      body: data?.message_text,
      android: {
        channelId,
        pressAction: {
          id: "default",
        },
      },
    });
  }

  let socket = null;

  const socketImplement = () => {
    if (!socket) {
      socket = io("wss://chat-api.sonart.tools");

      const jwt = userToken;

      socket.on("connect", async () => {
        socket.emit("message", userToken);
      });
      socket.on("disconnect", () => {
        console.log("Disconnected!");
      });

      socket.on("message", async (data) => {
        if (data.to_user == walletAddress) {
          onDisplayNotification(data);

          let tmpData = await AsyncStorage.getItem("chats");
          tmpData = JSON.parse(tmpData);

          let currentDate = new Date();

          data._createdAt = currentDate.toISOString();
          let tmp = [...tmpData];
          let index = tmp.findIndex((c) => c.name == data.from_user);

          if (index > -1) {
            tmp[index].messages = [...tmp[index].messages, data];
            tmp[index].message = data.message_text;
            tmp[index].time = currentDate.toISOString();
            setChats(tmp);
          } else {
            const response = await api.get(`/messages`);
            tmp = response.data.map((d, index) => {
              return {
                id: index,
                image: "https://i.pinimg.com/474x/9b/47/a0/9b47a023caf29f113237d61170f34ad9.jpg",
                name: d.recipient.address,
                message: d.messages[d.messages.length - 1].message_text,
                messages: d.messages,
                time: d.messages[d.messages.length - 1]._createdAt,
                counter: 0,
              };
            });
            setChats(tmp);
          }
        }
      });

      socket.on("connect_error", (error) => {
        console.log(error);
      });
    }
  };

  useEffect(() => {
    initialSetup();
    initialSetupForGroups();
  }, [bool]);
  const api = axios.create({
    baseURL: "http://192.168.18.8:10542",
    // baseURL: "https://chat-api.sonart.tools",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    },
  });

  const initialSetup = async () => {
    let tmp = [];
    try {
      const response = await api.get(`/messages`);
      tmp = response.data.map((d, index) => {
        return {
          id: index,
          image: "https://i.pinimg.com/474x/9b/47/a0/9b47a023caf29f113237d61170f34ad9.jpg",
          name: d.recipient.address,
          message: d.messages[d.messages.length - 1].message_text,
          messages: d.messages,
          time: d.messages[d.messages.length - 1]._createdAt,
          counter: 0,
        };
      });
      setChats(tmp);
    } catch (error) {
      console.log("ERRR", error);
    }
  };

  const initialSetupForGroups = async () => {
    let tmp = [];
    try {
      console.log("YES ");
      const response = await api.get(`/messages/getgroups`);
      setGChats(response.data);
      console.log("data response-> ",response.data.length);
    } catch (error) {
      console.log("ERRR", error);
    }
  };

  const actionOnRow = (item) => {
    navigation.navigate("Chat", {
      to: item?.name,
    });
  };
  const isGroupFun = (item, index) => {
    // let GroupUser = [];
    // if (GroupUser.length === 0) {
    //   GroupUser.push(item);
    // } else {
    //   GroupUser.forEach((ele) => {
    //     if (ele.item != item) {
    //       GroupUser.push(item);
    //       console.log("no");
    //     }
    //   });
    // }
    if (chats[index]?.selected) {
      chats[index].selected = false;
      itemToRemove(item);
    } else {
      chats[index].selected = true;
      onPress(item);
    }
    setGroupUser(item);
    setCoustomStyle({ backgroundColor: "grey" });
    // console.log(item.selected);
    // console.log(GroupUser);
    // onPress(true);
  };
  return (
    <>
      <FlatList
        style={{ marginVertical: 15 }}
        data={chats.sort((a, b) => {
          return new Date(b.time) - new Date(a.time);
        })}
        ItemSeparatorComponent={Separator}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            // activeOpacity={isGroup ? 1 : 0.3}
            onPress={() => (isGroup ? isGroupFun(item, index) : actionOnRow(item))}
          >
            <ChatListItem
              coustomStyle={item.selected ? coustomStyle : null}
              image={item.image}
              name={item?.name ? shortenHex(item.name) : null}
              message={item.message ? shortenString(item.message, 10) : null}
              time={item.time ? formatDate(item.time) : null}
              counter={item.counter}
            />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </>
  );
};

const styles = StyleSheet.create({
  separator: {
    height: 15,
    backgroundColor: "transparent",
  },
});

export default ChatList;

import _ from "lodash";
import { getCurrentUser } from "./jwtToken";
import { maliciousImageType } from "constant/types";

export const substringUsername = (username) => {
  return username.length > 20 ? `${username.substring(0, 19)}...` : username;
};

export const splitUserName = (participants) => {
  const sortList = [...participants].sort((a, b) => (a.id > b.id ? 1 : -1));
  sortList.map((user, index) => {
    if (user.username === getCurrentUser().username) {
      sortList[index].fullName = "Me";
    }
  });
  if (sortList.length > 2) {
    return sortList.map((user) => user.fullName).join(", ");
  } else {
    return sortList.filter((user) => user.fullName !== "Me")[0].fullName;
  }
};

export const resolveName = (name, field) => {
  if (name === getCurrentUser()[field]) {
    return "Me";
  } else {
    return name;
  }
};

export const filterParticipants = (participants) => {
  if (participants) {
    if (participants.length > 2) {
      return _.slice(
        participants,
        0,
        participants.length > 4 ? 4 : participants.length
      );
    } else {
      return participants.filter(
        (user) => user.username !== getCurrentUser().username
      );
    }
  } else {
    return [];
  }
};

export const targetAvatarLayout = (length, index, containerDemenssion) => {
  let returnStyle = {};
  if (length >= 4) {
    if (index === 0) {
      returnStyle = {
        top: 0,
        left: 0,
        borderTopLeftRadius: containerDemenssion,
      };
    }
    if (index === 1) {
      returnStyle = {
        right: 0,
        top: 0,
        borderTopRightRadius: containerDemenssion,
      };
    }
    if (index === 2) {
      returnStyle = {
        bottom: 0,
        left: 0,
        borderBottomLeftRadius: containerDemenssion,
      };
    }
    if (index === 3) {
      returnStyle = {
        bottom: 0,
        right: 0,
        borderBottomRightRadius: containerDemenssion,
      };
    }
    return {
      width: containerDemenssion / 2 - 2,
      height: containerDemenssion / 2 - 2,
      border: "1px solid white",
      ...returnStyle,
    };
  }
  if (length === 3) {
    if (index === 0) {
      returnStyle = {
        top: 0,
        left: 0,
        width: containerDemenssion,
        height: containerDemenssion,
        borderRadius: containerDemenssion,
      };
    }
    if (index === 1) {
      returnStyle = {
        top: 0,
        right: 0,
        width: containerDemenssion / 2 - 2,
        height: containerDemenssion / 2 - 2,
        border: "1px solid white",
        borderTopRightRadius: containerDemenssion,
      };
    }
    if (index === 2) {
      returnStyle = {
        bottom: 0,
        right: 0,
        width: containerDemenssion / 2 - 2,
        height: containerDemenssion / 2 - 2,
        border: "1px solid white",
        borderBottomRightRadius: containerDemenssion,
      };
    }
    return {
      ...returnStyle,
    };
  } else {
    return {
      width: containerDemenssion,
      height: containerDemenssion,
      borderRadius: containerDemenssion,
    };
  }
};

export const saveSearchList = (list, item) => {
  if (!list.find((listItem) => listItem.id === item.id)) {
    list.push(item);
    return _.reverse(_.slice(list, 0, 4));
  } else {
    const filtered = list.filter((listItem) => listItem.id !== item.id);
    filtered.push(item);
    return _.reverse(_.slice(filtered, 0, 4));
  }
};

export const getStatusOfConversation = (participants) => {
  let result = false;
  participants.map((user) => {
    if (user.isOnline && user.username !== getCurrentUser().username) {
      result = true;
    }
  });
  return result;
};

export const getAllCurrentInteractionUser = (currConvList) => {
  let result = [];
  currConvList.map((conv) => {
    conv.participants.map((user) => {
      if (
        !result.find((item) => item.id === user.id) &&
        user.username !== getCurrentUser().username
      ) {
        result.push(user);
      }
    });
  });
  return result;
};

export const getDifferenceItemBetweenTwoArrays = (array1, array2) => {
  const result = _.filter(array1, (itemOfArray1) => {
    return !_.some(array2, function (itemOfArray2) {
      return itemOfArray1.id === itemOfArray2.id;
    });
  });
  return result;
};

export const handleFilterHashtagOfCaption = (caption) => {
  const hashtagList = caption?.match(/(?<=(.*?)#)(.*?)(?=($|\s))/gi);
  let val = caption;
  let result = [];
  if (hashtagList) {
    hashtagList.map((hashtagName) => {
      const hashtag = `#${hashtagName}`;
      val =
        val.slice(0, val.indexOf(hashtag)) +
        '<hashtag class="hashtag-part">' +
        hashtag +
        "</hashtag>" +
        val.slice(val.indexOf(hashtag) + hashtag.length, val.length);
    });
  }
  return val;
};

export const handleCheckImageRange = (image, scoreList) => {
  const { drugs, gore, nudity, weapon } = scoreList;

  const maliciousRange = [];
  if (drugs >= 0.7) {
    maliciousRange.push(maliciousImageType.DRUGS);
  }
  if (gore?.prob >= 0.7) {
    maliciousRange.push(maliciousImageType.GORE);
  }
  if (nudity?.safe <= 0.3) {
    maliciousRange.push(maliciousImageType.NUDITY);
  }
  if (weapon >= 0.7) {
    maliciousRange.push(maliciousImageType.WEAPON);
  }
  return {
    image,
    maliciousRange
  }
};

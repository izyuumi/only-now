export const cacheRoomAndUser = (room: string, user: string) => {
  localStorage.setItem(room, user);
};

export const getUserFromRoom = (room: string) => {
  return localStorage.getItem(room);
};

export const removeUserFromRoom = (room: string) => {
  localStorage.removeItem(room);
};

import { useEffect } from "react";
import createSocketConnection from "utils/socketConfig";

export function useSocketEvents(events) {
  useEffect(() => {
    const socket = createSocketConnection();
    for (const event of events) {
      socket.on(event.name, event.handler);
    }

    return function () {
      for (const event of events) {
        socket.off(event.name);
      }
    };
  }, []);
}

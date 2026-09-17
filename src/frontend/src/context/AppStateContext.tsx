import type { ChatMessage, NavigationSession, RouteRequest } from "@/types";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface AppStateValue {
  /** Origin/destination pair handed to Smart Navigation. */
  routeRequest: RouteRequest | null;
  /** The navigation session currently being followed, if any. */
  navigation: NavigationSession | null;
  /** AI Campus Assistant conversation history. */
  chat: ChatMessage[];
  /** A question typed elsewhere (e.g. Home) waiting to be sent to the assistant. */
  pendingQuestion: string | null;
  /** Send a route request into Smart Navigation. */
  requestRoute: (request: RouteRequest) => void;
  /** Queue a question for the AI Campus Assistant to send on arrival. */
  askAssistant: (question: string) => void;
  /** Clear the queued question once the assistant has consumed it. */
  clearPendingQuestion: () => void;
  /** Clear the pending route request. */
  clearRouteRequest: () => void;
  /** Start following a planned route. */
  startNavigation: (session: NavigationSession) => void;
  /** Stop the active navigation session. */
  stopNavigation: () => void;
  /** Append a turn to the assistant conversation. */
  appendMessage: (message: ChatMessage) => void;
  /** Replace the whole conversation. */
  setChat: (messages: ChatMessage[]) => void;
  /** Clear the conversation. */
  clearChat: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [routeRequest, setRouteRequest] = useState<RouteRequest | null>(null);
  const [navigation, setNavigation] = useState<NavigationSession | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  const requestRoute = useCallback((request: RouteRequest) => {
    setRouteRequest({
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
  }, []);

  const askAssistant = useCallback((question: string) => {
    setPendingQuestion(question);
  }, []);

  const clearPendingQuestion = useCallback(() => {
    setPendingQuestion(null);
  }, []);

  const clearRouteRequest = useCallback(() => {
    setRouteRequest(null);
  }, []);

  const startNavigation = useCallback((session: NavigationSession) => {
    setNavigation(session);
  }, []);

  const stopNavigation = useCallback(() => {
    setNavigation(null);
  }, []);

  const appendMessage = useCallback((message: ChatMessage) => {
    setChat((current) => [...current, message]);
  }, []);

  const clearChat = useCallback(() => {
    setChat([]);
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      routeRequest,
      navigation,
      chat,
      pendingQuestion,
      requestRoute,
      askAssistant,
      clearPendingQuestion,
      clearRouteRequest,
      startNavigation,
      stopNavigation,
      appendMessage,
      setChat,
      clearChat,
    }),
    [
      routeRequest,
      navigation,
      chat,
      pendingQuestion,
      requestRoute,
      askAssistant,
      clearPendingQuestion,
      clearRouteRequest,
      startNavigation,
      stopNavigation,
      appendMessage,
      clearChat,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}

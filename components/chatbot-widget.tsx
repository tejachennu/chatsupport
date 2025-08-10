"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import { ChatbotPopup } from "./chatbot-popup"

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)

  // Simulate new message notification (you can integrate this with real notifications)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen && Math.random() > 0.95) {
        setHasNewMessage(true)
        setTimeout(() => setHasNewMessage(false), 5000)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isOpen])

  const togglePopup = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setHasNewMessage(false)
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {/* Notification Badge */}
          {hasNewMessage && !isOpen && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}

          {/* Pulse Animation for New Messages */}
          {hasNewMessage && !isOpen && (
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-75"></div>
          )}

          {/* Main Button */}
          <Button
            onClick={togglePopup}
            className={`
              w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out
              ${isOpen ? "bg-red-500 hover:bg-red-600 rotate-45" : "bg-blue-600 hover:bg-blue-700 hover:scale-110"}
              ${hasNewMessage && !isOpen ? "animate-bounce" : ""}
            `}
          >
            {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
          </Button>
        </div>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              Need help? Chat with us!
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>

      {/* Chatbot Popup */}
      <ChatbotPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

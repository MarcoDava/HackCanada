"use client"
import { useState, useEffect, useCallback } from "react"
import { useAuthenticatedAxios } from "@/components/AuthContext"

interface Props { contact: any; company: string; onClose: () => void }

export default function MessageModal({ contact, company, onClose }: Props) {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const getAuthAxios = useAuthenticatedAxios()

  const generateMessage = useCallback(async () => {
    setLoading(true)
    try {
      const axios = await getAuthAxios()
      const res = await axios.post("/api/messages/generate", {
        target_person: contact,
        target_company: company,
        bridge_person: contact.bridge || null,
      })
      setMessage(res.data.message)
    } catch (err) {
      setMessage("Failed to generate message. Please try again.")
    } finally { 
      setLoading(false) 
    }
  }, [getAuthAxios, contact, company])

  useEffect(() => { 
    generateMessage() 
  }, [generateMessage])

  const copy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">Outreach to {contact.name}</h2>
            <p className="text-sm text-gray-400">{contact.title} at {company}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-500">Generating message...</div>
        ) : (
          <>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={7}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-blue-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={copy} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium transition">
                {copied ? "Copied!" : "Copy Message"}
              </button>
              <button onClick={generateMessage} className="border border-gray-600 hover:border-gray-400 px-4 py-2.5 rounded-lg text-sm transition">Regenerate</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

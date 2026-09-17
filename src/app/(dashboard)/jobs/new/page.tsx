"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, User, Wrench, Users, Banknote, CreditCard, Smartphone } from "lucide-react";

interface Technician {
  id: string;
  name: string;
  phone?: string;
}

export default function NewJobPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Customer Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  // Device Info
  const [deviceType, setDeviceType] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [problem, setProblem] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  
  // Technician
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  
  // Payment
  const [laborCharge, setLaborCharge] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState("");
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const res = await fetch("/api/technicians");
      const data = await res.json();
      setTechnicians(data);
    } catch (error) {
      console.error("Failed to fetch technicians:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate
    if (!customerName || !customerPhone || !deviceType || !problem) {
      setError("Please fill in all required fields (Name, Phone, Device, Problem)");
      setLoading(false);
      return;
    }

    if (!selectedTechnician) {
      setError("Please select a technician (fix man)");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deviceType,
          deviceModel,
          problem,
          priority,
          technicianId: selectedTechnician,
          createdById: session?.user?.id,
          laborCharge: parseFloat(laborCharge) || 0,
          paymentMethod,
          paidAmount: parseFloat(paidAmount) || 0,
          status: "ASSIGNED",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create job");
      }

      const job = await response.json();
      setSuccess(`Job ${job.jobNumber} created and assigned to technician!`);
      
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setDeviceType("");
      setDeviceModel("");
      setProblem("");
      setLaborCharge("");
      setPaidAmount("");
      setSelectedTechnician("");
      
      setTimeout(() => {
        setSuccess("");
        router.push("/jobs");
      }, 3000);
      
    } catch (error: any) {
      setError(error.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Repair Job</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
          ✅ {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="mr-2 h-5 w-5" />
            Customer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Abebe Kebede"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g., 0911223344"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Device Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Wrench className="mr-2 h-5 w-5" />
            Device & Problem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Device Type *</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select device type</option>
                <option value="Phone">Phone</option>
                <option value="Tablet">Tablet</option>
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Device Model</label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="e.g., Samsung A24, iPhone 12"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Problem Description *</label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g., Screen broken, battery not charging, speaker not working..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Technician Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Assign Technician (Fix Man)
          </h2>
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select a technician</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name} {tech.phone ? `- ${tech.phone}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Banknote className="mr-2 h-5 w-5" />
            Payment (Optional - can be collected later)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Labor Charge (ETB)</label>
              <input
                type="number"
                value={laborCharge}
                onChange={(e) => setLaborCharge(e.target.value)}
                placeholder="e.g., 500"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Paid Amount (ETB)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="e.g., 200"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`p-3 border rounded-md flex flex-col items-center ${
                  paymentMethod === "CASH" ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}
              >
                <Banknote className="h-6 w-6 mb-1" />
                <span className="text-sm">Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`p-3 border rounded-md flex flex-col items-center ${
                  paymentMethod === "BANK_TRANSFER" ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}
              >
                <CreditCard className="h-6 w-6 mb-1" />
                <span className="text-sm">Bank</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("MOBILE_MONEY")}
                className={`p-3 border rounded-md flex flex-col items-center ${
                  paymentMethod === "MOBILE_MONEY" ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}
              >
                <Smartphone className="h-6 w-6 mb-1" />
                <span className="text-sm">Mobile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-lg disabled:opacity-50"
        >
          {loading ? "Creating Job..." : "Create & Assign Job"}
        </button>
      </form>
    </div>
  );
}
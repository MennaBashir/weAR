import { useState } from "react";
import {
  User,
  CreditCard,
  Settings as SettingsIcon,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function RetailerSettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "payment" | "account">(
    "profile",
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1328px] mx-auto font-sans">
      <h1
        className="text-[24px] md:text-[28px] font-bold text-[#B6A092]"
        style={{ fontFamily: '"PT Serif", serif' }}
      >
        Settings
      </h1>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-6 py-4 rounded-[16px] text-[15px] font-bold transition-all ${
              activeTab === "profile"
                ? "bg-[#C9A390] text-white shadow-md"
                : "bg-white text-[#949E96] border border-[#E4DCD1] hover:bg-[#FEF9F2] hover:text-[#C9A390]"
            }`}
          >
            <User size={20} />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`flex items-center gap-3 px-6 py-4 rounded-[16px] text-[15px] font-bold transition-all ${
              activeTab === "payment"
                ? "bg-[#C9A390] text-white shadow-md"
                : "bg-white text-[#949E96] border border-[#E4DCD1] hover:bg-[#FEF9F2] hover:text-[#C9A390]"
            }`}
          >
            <CreditCard size={20} />
            Payment Method
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-3 px-6 py-4 rounded-[16px] text-[15px] font-bold transition-all ${
              activeTab === "account"
                ? "bg-[#C9A390] text-white shadow-md"
                : "bg-white text-[#949E96] border border-[#E4DCD1] hover:bg-[#FEF9F2] hover:text-[#C9A390]"
            }`}
          >
            <SettingsIcon size={20} />
            Account Settings
          </button>
        </div>

        <div className="flex-1 w-full rounded-[24px] border border-[#E4DCD1] bg-white p-6 md:p-10 shadow-sm">
          {activeTab === "profile" && <ProfileInformation />}
          {activeTab === "payment" && <PaymentMethod />}
          {activeTab === "account" && <AccountSettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileInformation() {
  const [viewState, setViewState] = useState<"view" | "edit" | "password">(
    "view",
  );

  const inputStyle =
    "h-[50px] w-full rounded-[10px] border border-[#E4DCD1] px-4 text-[14px] outline-none focus:border-[#C9A390] text-[#5C5550]";
  const labelStyle = "mb-2 block text-[13px] font-bold text-[#949E96]";

  if (viewState === "edit") {
    return (
      <div className="flex flex-col gap-8 w-full max-w-[800px]">
        <h2
          className="text-[22px] font-bold text-[#C9A390]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Edit Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>Full Name</label>
            <input
              type="text"
              defaultValue="Mohamed Ahmed"
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Account Type</label>
            <input
              type="text"
              defaultValue="Admin"
              disabled
              className={`${inputStyle} bg-gray-50`}
            />
          </div>
          <div>
            <label className={labelStyle}>Email Address</label>
            <input
              type="email"
              defaultValue="mohamedahmed@gmail.com"
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Brand Name</label>
            <input type="text" defaultValue="Cavo" className={inputStyle} />
          </div>
          <div>
            <label className={labelStyle}>Phone Number</label>
            <input
              type="text"
              defaultValue="+201229086941"
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Business Type</label>
            <input
              type="text"
              defaultValue="Online Store"
              className={inputStyle}
            />
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setViewState("view")}
            className="px-10 py-3 rounded-[12px] bg-[#C9A390] text-white text-[14px] font-bold hover:opacity-90"
          >
            Save
          </button>
          <button
            onClick={() => setViewState("view")}
            className="px-10 py-3 rounded-[12px] border border-[#E4DCD1] text-[#949E96] text-[14px] font-bold hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (viewState === "password") {
    return (
      <div className="flex flex-col gap-8 w-full max-w-[500px]">
        <h2
          className="text-[22px] font-bold text-[#C9A390]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Change Password
        </h2>
        <div className="flex flex-col gap-6">
          <div>
            <label className={labelStyle}>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              className={inputStyle}
            />
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setViewState("view")}
            className="px-10 py-3 rounded-[12px] bg-[#C9A390] text-white text-[14px] font-bold hover:opacity-90"
          >
            Save
          </button>
          <button
            onClick={() => setViewState("view")}
            className="px-10 py-3 rounded-[12px] border border-[#E4DCD1] text-[#949E96] text-[14px] font-bold hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h2
        className="text-[22px] font-bold text-[#C9A390]"
        style={{ fontFamily: '"PT Serif", serif' }}
      >
        Profile Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
        <div>
          <p className={labelStyle}>Full Name</p>
          <p className="text-[15px] font-bold text-[#5C5550]">Mohamed Ahmed</p>
        </div>
        <div>
          <p className={labelStyle}>Account Type</p>
          <p className="text-[15px] font-bold text-[#5C5550]">Admin</p>
        </div>
        <div>
          <p className={labelStyle}>Email Address</p>
          <p className="text-[15px] font-bold text-[#5C5550]">
            mohamedahmed@gmail.com
          </p>
        </div>
        <div>
          <p className={labelStyle}>Brand Name</p>
          <p className="text-[15px] font-bold text-[#5C5550]">Cavo</p>
        </div>
        <div>
          <p className={labelStyle}>Member Since</p>
          <p className="text-[15px] font-bold text-[#5C5550]">Dec 1st, 2025</p>
        </div>
        <div>
          <p className={labelStyle}>Business Type</p>
          <p className="text-[15px] font-bold text-[#5C5550]">Online Store</p>
        </div>
        <div>
          <p className={labelStyle}>Phone Number</p>
          <p className="text-[15px] font-bold text-[#5C5550]">+201229086941</p>
        </div>
        <div>
          <p className={labelStyle}>Brand Logo</p>
          <div className="flex items-center justify-center w-16 h-16 bg-[#FEF9F2] border border-[#E4DCD1] rounded-[10px] text-[#C9A390] font-bold text-[12px]">
            CAVO
          </div>
        </div>
      </div>
      <div className="flex gap-4 pt-6 border-t border-[#F0EDEB] mt-4">
        <button
          onClick={() => setViewState("edit")}
          className="px-8 py-3 rounded-[12px] bg-[#C9A390] text-white text-[14px] font-bold hover:opacity-90"
        >
          Edit Profile
        </button>
        <button
          onClick={() => setViewState("password")}
          className="px-8 py-3 rounded-[12px] border border-[#C9A390] text-[#C9A390] text-[14px] font-bold hover:bg-[#FEF9F2]"
        >
          Change Password
        </button>
      </div>
    </div>
  );
}

function PaymentMethod() {
  const [recurring, setRecurring] = useState(true);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <h2
          className="text-[22px] font-bold text-[#C9A390]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Payment Method
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-[20px] border border-[#E4DCD1] bg-[#FEF9F2]/30 max-w-[600px]">
          <div className="w-[80px] h-[50px] bg-[#1434CB] rounded-[8px] flex items-center justify-center text-white font-bold text-[20px] italic">
            VISA
          </div>
          <div className="flex-1 w-full text-center md:text-left">
            <h3 className="text-[16px] font-bold text-[#5C5550]">
              VISA **** 8092
            </h3>
            <p className="text-[13px] text-[#949E96] mt-1">
              Your recurring payment method is visa
            </p>
          </div>
          <button className="px-6 py-2 rounded-[10px] border border-[#E4DCD1] text-[#949E96] text-[13px] font-bold hover:bg-gray-50">
            Edit
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-[#F0EDEB] pt-8">
        <h2
          className="text-[22px] font-bold text-[#C9A390]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Account Settings
        </h2>
        <div className="flex items-center justify-between p-6 rounded-[20px] border border-[#E4DCD1] max-w-[600px]">
          <div>
            <h3 className="text-[15px] font-bold text-[#5C5550]">
              Enable recurring payments
            </h3>
            <p className="text-[13px] text-[#949E96] mt-1">
              Never miss a payment by enabling automatic renewals.
            </p>
          </div>
          <button
            onClick={() => setRecurring(!recurring)}
            className={`relative w-12 h-6 rounded-full transition-colors ${recurring ? "bg-[#C9A390]" : "bg-gray-300"}`}
          >
            <div
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${recurring ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountSettings() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-10">
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[420px] rounded-[24px] bg-white p-8 text-center shadow-2xl flex flex-col items-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFE4E4] text-[#F06161]">
              <AlertTriangle size={36} />
            </div>
            <h3 className="text-[24px] font-bold text-[#5C5550]">Warning!</h3>
            <p className="mt-4 text-[14px] text-[#949E96] leading-relaxed px-4">
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers. Are you
              absolutely sure you want to delete your account?
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  navigate("/login/retailer");
                }}
                className="flex-1 rounded-[12px] bg-[#F06161] py-3.5 font-bold text-white hover:bg-red-700 transition-colors text-[14px]"
              >
                Delete Account
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-[12px] border border-[#E4DCD1] py-3.5 font-bold text-[#949E96] hover:bg-gray-50 transition-colors text-[14px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="mb-2">
          <h2
            className="text-[22px] font-bold text-[#C9A390]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Notifications
          </h2>
          <p className="text-[14px] text-[#949E96] mt-1">
            Manage your notification preferences
          </p>
        </div>
        <div className="flex flex-col gap-4 max-w-[600px]">
          <div className="flex items-center justify-between p-5 rounded-[16px] border border-[#E4DCD1]">
            <span className="text-[14px] font-bold text-[#5C5550]">
              Email Notifications
            </span>
            <button
              onClick={() => setEmailNotif(!emailNotif)}
              className={`relative w-11 h-6 rounded-full transition-colors ${emailNotif ? "bg-[#4CAF50]" : "bg-gray-300"}`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${emailNotif ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-5 rounded-[16px] border border-[#E4DCD1]">
            <span className="text-[14px] font-bold text-[#5C5550]">
              SMS Notifications
            </span>
            <button
              onClick={() => setSmsNotif(!smsNotif)}
              className={`relative w-11 h-6 rounded-full transition-colors ${smsNotif ? "bg-[#4CAF50]" : "bg-gray-300"}`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${smsNotif ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-[#F0EDEB] pt-8">
        <h2
          className="text-[22px] font-bold text-[#F06161]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Danger Zone
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-[20px] border border-[#FFE4E4] bg-[#FFE4E4]/30 max-w-[600px] gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-[15px] font-bold text-[#5C5550]">
              Delete Account
            </h3>
            <p className="text-[13px] text-[#949E96] mt-1">
              Once you deleted your account, there is no going back. Please be
              certain.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-[12px] bg-[#F06161] text-white text-[13px] font-bold hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

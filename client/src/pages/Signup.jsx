import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../axios";
import { useNavigate } from "react-router-dom";
import { PulseLoader } from "react-spinners";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 8.841C34.522 4.938 29.521 2.5 24 2.5C11.454 2.5 2.5 11.454 2.5 24s8.954 21.5 21.5 21.5S45.5 36.546 45.5 24c0-1.573-.154-3.097-.439-4.561z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691L12.05 19.12C14.473 14.018 18.907 10.5 24 10.5c3.059 0 5.842 1.154 7.961 3.039L38.804 8.841C34.522 4.938 29.521 2.5 24 2.5C16.318 2.5 9.642 6.713 6.306 12.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 45.5c5.521 0 10.522-2.438 14.804-6.359L32.039 32.84c-2.119 2.885-5.41 4.66-9.039 4.66c-5.093 0-9.527-3.518-11.95-8.62L6.306 33.309C9.642 39.287 16.318 43.5 24 43.5z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l7.764 6.203C42.818 36.142 45.5 30.492 45.5 24c0-1.573-.154-3.097-.439-4.561z"
    />
  </svg>
);
const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    rePassword: "",
    terms: false,
  });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };


  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Fetch user information from Google
        const userInfoResponse = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );

        const {
          given_name: firstName,
          family_name: lastName,
          email,
        } = userInfoResponse.data;

        // await fetch(
        //   "https://script.google.com/macros/s/AKfycbzyrPKLdh6B_OhxOch-zASCifVY4ahsVpSEZhscigxnuhibAvu31a8iC1uFUXVjvC7ntA/exec",
        //   {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "text/plain",
        //     },
        //     body: JSON.stringify({ firstName, lastName, email }),
        //   }
        // );

        const response = await axiosInstance.post("/auth/google-signup", {
          firstName,
          lastName,
          email,
        });

        toast.success(response.data.message);
        navigate("/login");
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Google Signup failed. Please try again."
        );
        console.error("Google Signup Error:", error);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toast.error("Google Signup failed. Please try again.");
    },
  });

  // --- End of new flow ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.rePassword
    ) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!formData.terms) {
      toast.error("Please accept the Terms of Service.");
      return;
    }
    if (formData.password !== formData.rePassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/signup", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      toast.success(
        "Signup successful! Please check your email for verification."
      );
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (error) {
      setTimeout(() => {
        toast.error(
          error.response?.data?.message || "Signup failed. Please try again."
        );
      }, 1000);
      console.error("Signup error:", error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <PulseLoader size={15} color="#12EB8E" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0D191C] p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <form
        onSubmit={handleSubmit}
        className="bg-[#0D191C] w-full max-w-md p-4 sm:p-6 md:p-8 rounded-lg"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#12EB8E] text-center">
          Sign Up
        </h1>

        {/* Name fields */}
        <div className="flex flex-col md:flex-row md:space-x-3">
          <div className="mb-4 w-full">
            <label htmlFor="firstName" className="block text-white mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="John"
            />
          </div>
          <div className="mb-4 w-full">
            <label htmlFor="lastName" className="block text-white mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-white mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="john.doe@example.com"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-white mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="••••••••"
          />
        </div>

        {/* Re-enter Password */}
        <div className="mb-4">
          <label htmlFor="rePassword" className="block text-white mb-2">
            Re-enter Password
          </label>
          <input
            type="password"
            id="rePassword"
            value={formData.rePassword}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="••••••••"
          />
        </div>

        {/* Terms of Service Checkbox */}
        <div className="mb-6 flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={formData.terms}
            onChange={handleChange}
            className="h-5 w-5 text-green-400 accent-green-400 focus:ring-green-400 mt-1"
          />
          <label htmlFor="terms" className="text-gray-300 text-sm">
            I’ve read and agree with Terms of Service and our Privacy Policy
          </label>
        </div>

        {/* Sign Up Button */}
        <button
          type="submit"
          className="w-full py-2 mb-4 text-black font-semibold rounded-md hover:text-white transition-colors"
          style={{ backgroundColor: "#12EB8E" }}
        >
          Sign Up
        </button>

        {/* OR divider */}
        <div className="flex items-center mb-4">
          <div className="h-px flex-1 bg-gray-600"></div>
          <span className="px-2 text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-600"></div>
        </div>

        {/* Social Sign Up Buttons */}
        <div className="flex flex-col sm:flex-row mb-4">
          <button
            type="button"
            onClick={() => handleGoogleSignup()}
            className="flex-1 py-2.5 flex items-center justify-center text-white rounded-md transition-colors border border-[#12EB8E] hover:bg-[#12EB8E] hover:text-black font-semibold"
          >
            <GoogleIcon />
            Sign up with Google
          </button>
        </div>

        {/* Already have an account? */}
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-green-400 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;

"use client";
import { useState } from 'react';

export default function AddEmploymentModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8 flex justify-center items-center min-h-screen bg-slate-900">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition"
      >
        Add Employment
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          {/* Modal Container */}
          <div className="bg-white text-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-8">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Add employment</h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-4">

              {/* Title */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Name this position"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Employment type
                </label>
                <input
                  type="text"
                  placeholder="Ex: Full-time"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Company or organization <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Microsoft"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Search or select location"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-700">
                    Start date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition [color-scheme:light]"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-700">
                    End date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition [color-scheme:light]"
                  />
                </div>
              </div>

              {/* Salary Details Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-700">
                    Minimum salary
                  </label>
                  <input
                    type="text"
                    defaultValue="150"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-700">
                    Currency
                  </label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-700">
                    Frequency
                  </label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option>Monthly</option>
                    <option>Yearly</option>
                    <option>Hourly</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Add any notes about this role"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                />
              </div>

              {/* Footer / Controls */}
              <div className="pt-4 flex items-center justify-end border-t border-slate-200 mt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
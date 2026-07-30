"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";

interface EventOrganizerFormProps {
  locale: string;
}

export default function EventOrganizerForm({ locale }: EventOrganizerFormProps) {
  const t = useTranslations("contactPage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    eventName: "",
    organizerName: "",
    location: "",
    startAt: "",
    endAt: "",
    contactName: "",
    phone: "",
    email: "",
    inquiryPurpose: "",
    details: "",
    consentGiven: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const payload = {
        type: "EVENT_ORGANIZER",
        locale: locale || "zh",
        ...formData,
        startAt: new Date(formData.startAt),
        endAt: new Date(formData.endAt),
        idempotencyKey: uuidv4(),
        formStartedAt: Date.now() - 5000,
        turnstileToken: "mock-token",
        website: "",
      };

      const response = await fetch("/api/contact-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || t("common.error"));
      }

      setSubmitStatus("success");
      setFormData({
        eventName: "",
        organizerName: "",
        location: "",
        startAt: "",
        endAt: "",
        contactName: "",
        phone: "",
        email: "",
        inquiryPurpose: "",
        details: "",
        consentGiven: false,
      });
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : t("common.submissionError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitStatus === "success" && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          {t("common.success")}
        </div>
      )}

      {submitStatus === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* 活动信息 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("common.eventInfo")}</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("eventOrganizer.eventName")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder={t("eventOrganizer.eventNamePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("eventOrganizer.organizerName")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="organizerName"
              value={formData.organizerName}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder={t("eventOrganizer.organizerNamePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("eventOrganizer.location")}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            maxLength={500}
            placeholder={t("eventOrganizer.locationPlaceholder")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("eventOrganizer.startDate")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="startAt"
              value={formData.startAt}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("eventOrganizer.endDate")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="endAt"
              value={formData.endAt}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>
        </div>
      </div>

      {/* 联系方式 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("common.contactWay")}</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("eventOrganizer.contactName")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder={t("eventOrganizer.contactNamePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("eventOrganizer.phone")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={20}
              placeholder={t("eventOrganizer.phonePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("eventOrganizer.email")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t("eventOrganizer.emailPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("eventOrganizer.inquiryPurpose")}
            </label>
            <select
              name="inquiryPurpose"
              value={formData.inquiryPurpose}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            >
              <option value="">{t("common.pleaseSelect")}</option>
              <option value="EXHIBITION">
                {t("options.eventPurposes.EXHIBITION")}
              </option>
              <option value="FORUM">
                {t("options.eventPurposes.FORUM")}
              </option>
              <option value="ASSOCIATION">
                {t("options.eventPurposes.ASSOCIATION")}
              </option>
              <option value="OTHER">
                {t("options.eventPurposes.OTHER")}
              </option>
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {t("common.atLeastOneContact")}
        </p>
      </div>

      {/* 活动详情 */}
      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("eventOrganizer.details")} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="details"
          value={formData.details}
          onChange={handleChange}
          required
          maxLength={300}
          rows={4}
          placeholder={t("eventOrganizer.detailsPlaceholder")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
        />
      </div>

      {/* 隐私政策 */}
      <div className="border-t pt-6">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="consentGiven"
            checked={formData.consentGiven}
            onChange={handleChange}
            required
            className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-[#2463c5]"
          />
          <span className="text-sm text-gray-600">
            {t("common.privacy")}
            <a href={`/${locale}/privacy`} className="text-[#2463c5] hover:underline">
              {t("common.privacyPolicy")}
            </a>
          </span>
        </label>
      </div>

      {/* 提交按钮 */}
      <div className="border-t pt-6 flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-[#2463c5] text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
        >
          {isSubmitting ? t("common.submitting") : t("common.submit")}
        </button>
        <button
          type="reset"
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
        >
          {t("common.reset")}
        </button>
      </div>
    </form>
  );
}

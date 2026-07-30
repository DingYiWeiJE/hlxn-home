"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";

interface MediaFormProps {
  locale: string;
}

export default function MediaForm({ locale }: MediaFormProps) {
  const t = useTranslations("contactPage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    mediaName: "",
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
        type: "MEDIA",
        locale: locale || "zh",
        ...formData,
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
        mediaName: "",
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

      {/* 媒体信息 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("common.mediaInfo")}</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("media.mediaName")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="mediaName"
            value={formData.mediaName}
            onChange={handleChange}
            required
            maxLength={200}
            placeholder={t("media.mediaNamePlaceholder")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
          />
        </div>
      </div>

      {/* 联系方式 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("common.contactWay")}</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("media.contactName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder={t("media.contactNamePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("media.phone")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={20}
              placeholder={t("media.phonePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("media.email")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t("media.emailPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("media.inquiryPurpose")}
            </label>
            <select
              name="inquiryPurpose"
              value={formData.inquiryPurpose}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            >
              <option value="">{t("common.pleaseSelect")}</option>
              <option value="ADVERTISING">
                {t("options.mediaPurposes.ADVERTISING")}
              </option>
              <option value="INTERVIEW">
                {t("options.mediaPurposes.INTERVIEW")}
              </option>
              <option value="VISIT">
                {t("options.mediaPurposes.VISIT")}
              </option>
              <option value="EVENT">
                {t("options.mediaPurposes.EVENT")}
              </option>
              <option value="OTHER">
                {t("options.mediaPurposes.OTHER")}
              </option>
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {t("common.atLeastOneContact")}
        </p>
      </div>

      {/* 详细需求 */}
      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("media.details")} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="details"
          value={formData.details}
          onChange={handleChange}
          required
          maxLength={2000}
          rows={5}
          placeholder={t("media.detailsPlaceholder")}
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

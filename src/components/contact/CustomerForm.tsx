"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";

interface CustomerFormProps {
  locale: string;
}

export default function CustomerForm({ locale }: CustomerFormProps) {
  const t = useTranslations("contactPage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    mainBusiness: "",
    regionDetail: "",
    contactName: "",
    jobTitle: "",
    phone: "",
    email: "",
    applicationType: "",
    productType: "",
    chemicalSystem: "",
    cellShape: "",
    specificScenario: "",
    unitPackCapacityKwh: "",
    unitPackVoltageV: "",
    spaceDimensions: "",
    annualElectricityKwh: "",
    chargingHours: "",
    otherRequirements: "",
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
        type: "CUSTOMER",
        locale: locale || "zh",
        ...formData,
        unitPackCapacityKwh: formData.unitPackCapacityKwh
          ? parseFloat(formData.unitPackCapacityKwh)
          : null,
        unitPackVoltageV: formData.unitPackVoltageV
          ? parseFloat(formData.unitPackVoltageV)
          : null,
        annualElectricityKwh: formData.annualElectricityKwh
          ? parseFloat(formData.annualElectricityKwh)
          : null,
        chargingHours: formData.chargingHours
          ? parseFloat(formData.chargingHours)
          : null,
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
        throw new Error(error.error?.message || "提交失败");
      }

      setSubmitStatus("success");
      setFormData({
        companyName: "",
        mainBusiness: "",
        regionDetail: "",
        contactName: "",
        jobTitle: "",
        phone: "",
        email: "",
        applicationType: "",
        productType: "",
        chemicalSystem: "",
        cellShape: "",
        specificScenario: "",
        unitPackCapacityKwh: "",
        unitPackVoltageV: "",
        spaceDimensions: "",
        annualElectricityKwh: "",
        chargingHours: "",
        otherRequirements: "",
        consentGiven: false,
      });
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "提交出错，请稍后重试"
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

      {/* 企业信息 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">企业信息</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.companyName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder={t("customer.companyNamePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.mainBusiness")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="mainBusiness"
              value={formData.mainBusiness}
              onChange={handleChange}
              required
              maxLength={500}
              placeholder={t("customer.mainBusinessPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("customer.regionDetail")} <span className="text-red-500">*</span>
          </label>
          <textarea
            name="regionDetail"
            value={formData.regionDetail}
            onChange={handleChange}
            required
            maxLength={500}
            rows={3}
            placeholder={t("customer.regionDetailPlaceholder")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
          />
        </div>
      </div>

      {/* 联系方式 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">联系方式</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.contactName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder={t("customer.contactNamePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.jobTitle")}
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              maxLength={100}
              placeholder={t("customer.jobTitlePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.phone")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={20}
              placeholder={t("customer.phonePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.email")}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t("customer.emailPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {t("common.atLeastOneContact")}
        </p>
      </div>

      {/* 应用信息 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">应用信息</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.applicationType")}
            </label>
            <select
              name="applicationType"
              value={formData.applicationType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            >
              <option value="">请选择</option>
              <option value="PASSENGER_VEHICLE">
                {t("options.applicationTypes.PASSENGER_VEHICLE")}
              </option>
              <option value="BUS">
                {t("options.applicationTypes.BUS")}
              </option>
              <option value="LOGISTICS_VEHICLE">
                {t("options.applicationTypes.LOGISTICS_VEHICLE")}
              </option>
              <option value="ENERGY_STORAGE">
                {t("options.applicationTypes.ENERGY_STORAGE")}
              </option>
              <option value="OTHER">
                {t("options.applicationTypes.OTHER")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.productType")}
            </label>
            <select
              name="productType"
              value={formData.productType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            >
              <option value="">请选择</option>
              <option value="CELL">{t("options.productTypes.CELL")}</option>
              <option value="MODULE">
                {t("options.productTypes.MODULE")}
              </option>
              <option value="BATTERY_PACK">
                {t("options.productTypes.BATTERY_PACK")}
              </option>
              <option value="BMS">{t("options.productTypes.BMS")}</option>
              <option value="OTHER">
                {t("options.productTypes.OTHER")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.chemicalSystem")}
            </label>
            <select
              name="chemicalSystem"
              value={formData.chemicalSystem}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            >
              <option value="">请选择</option>
              <option value="TERNARY">
                {t("options.chemicalSystems.TERNARY")}
              </option>
              <option value="LFP">
                {t("options.chemicalSystems.LFP")}
              </option>
              <option value="EITHER">
                {t("options.chemicalSystems.EITHER")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.cellShape")}
            </label>
            <select
              name="cellShape"
              value={formData.cellShape}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            >
              <option value="">请选择</option>
              <option value="PRISMATIC">
                {t("options.cellShapes.PRISMATIC")}
              </option>
              <option value="OTHER">
                {t("options.cellShapes.OTHER")}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* 技术需求 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">技术需求</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.unitPackCapacity")}
            </label>
            <input
              type="number"
              name="unitPackCapacityKwh"
              value={formData.unitPackCapacityKwh}
              onChange={handleChange}
              step="0.1"
              min="0"
              placeholder={t("customer.unitPackCapacityPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.unitPackVoltage")}
            </label>
            <input
              type="number"
              name="unitPackVoltageV"
              value={formData.unitPackVoltageV}
              onChange={handleChange}
              step="0.1"
              min="0"
              placeholder={t("customer.unitPackVoltagePlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.spaceDimensions")}
            </label>
            <input
              type="text"
              name="spaceDimensions"
              value={formData.spaceDimensions}
              onChange={handleChange}
              maxLength={200}
              placeholder={t("customer.spaceDimensionsPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.annualElectricity")}
            </label>
            <input
              type="number"
              name="annualElectricityKwh"
              value={formData.annualElectricityKwh}
              onChange={handleChange}
              step="0.1"
              min="0"
              placeholder={t("customer.annualElectricityPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customer.chargingHours")}
            </label>
            <input
              type="number"
              name="chargingHours"
              value={formData.chargingHours}
              onChange={handleChange}
              step="0.1"
              min="0"
              placeholder={t("customer.chargingHoursPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("customer.otherRequirements")}
          </label>
          <textarea
            name="otherRequirements"
            value={formData.otherRequirements}
            onChange={handleChange}
            maxLength={2000}
            rows={4}
            placeholder={t("customer.otherRequirementsPlaceholder")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2463c5]"
          />
        </div>
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
            <a href="/privacy" className="text-[#2463c5] hover:underline">
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

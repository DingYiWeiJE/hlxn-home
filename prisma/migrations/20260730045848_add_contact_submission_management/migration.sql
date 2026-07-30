-- CreateEnum
CREATE TYPE "ContactSubmissionType" AS ENUM ('CUSTOMER', 'MEDIA', 'EVENT_ORGANIZER');

-- CreateEnum
CREATE TYPE "ContactSubmissionStatus" AS ENUM ('PENDING', 'FOLLOWING_UP', 'CONTACTED', 'COMPLETED', 'INVALID', 'SPAM');

-- CreateEnum
CREATE TYPE "ContactSubmissionRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ContactSubmissionNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "type" "ContactSubmissionType" NOT NULL,
    "locale" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT,
    "phoneNormalized" TEXT,
    "email" TEXT,
    "emailNormalized" TEXT,
    "status" "ContactSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "riskLevel" "ContactSubmissionRiskLevel" NOT NULL DEFAULT 'LOW',
    "riskReasons" JSONB NOT NULL DEFAULT '[]',
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOfId" TEXT,
    "duplicateReason" TEXT,
    "contentFingerprint" TEXT,
    "idempotencyKey" TEXT,
    "sourcePath" TEXT,
    "referrer" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "consentAt" TIMESTAMP(3),
    "privacyPolicyVersion" TEXT,
    "notificationStatus" "ContactSubmissionNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "notificationError" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInquiry" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "mainBusiness" TEXT NOT NULL,
    "regionDetail" TEXT NOT NULL,
    "jobTitle" TEXT,
    "applicationType" TEXT,
    "productType" TEXT,
    "chemicalSystem" TEXT,
    "cellShape" TEXT,
    "specificScenario" TEXT,
    "unitPackCapacityKwh" DECIMAL(65,30),
    "unitPackVoltageV" DECIMAL(65,30),
    "spaceDimensions" TEXT,
    "annualElectricityKwh" DECIMAL(65,30),
    "chargingHours" DECIMAL(65,30),
    "otherRequirements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaInquiry" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "mediaName" TEXT NOT NULL,
    "inquiryPurpose" TEXT,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventOrganizerInquiry" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "organizerName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "inquiryPurpose" TEXT,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventOrganizerInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmissionNote" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContactSubmissionNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactSubmission_type_idx" ON "ContactSubmission"("type");

-- CreateIndex
CREATE INDEX "ContactSubmission_locale_idx" ON "ContactSubmission"("locale");

-- CreateIndex
CREATE INDEX "ContactSubmission_status_idx" ON "ContactSubmission"("status");

-- CreateIndex
CREATE INDEX "ContactSubmission_riskLevel_idx" ON "ContactSubmission"("riskLevel");

-- CreateIndex
CREATE INDEX "ContactSubmission_isDuplicate_idx" ON "ContactSubmission"("isDuplicate");

-- CreateIndex
CREATE INDEX "ContactSubmission_duplicateOfId_idx" ON "ContactSubmission"("duplicateOfId");

-- CreateIndex
CREATE INDEX "ContactSubmission_emailNormalized_idx" ON "ContactSubmission"("emailNormalized");

-- CreateIndex
CREATE INDEX "ContactSubmission_phoneNormalized_idx" ON "ContactSubmission"("phoneNormalized");

-- CreateIndex
CREATE INDEX "ContactSubmission_contentFingerprint_idx" ON "ContactSubmission"("contentFingerprint");

-- CreateIndex
CREATE INDEX "ContactSubmission_submittedAt_idx" ON "ContactSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_deletedAt_idx" ON "ContactSubmission"("deletedAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_notificationStatus_idx" ON "ContactSubmission"("notificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ContactSubmission_idempotencyKey_key" ON "ContactSubmission"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerInquiry_submissionId_key" ON "CustomerInquiry"("submissionId");

-- CreateIndex
CREATE INDEX "CustomerInquiry_submissionId_idx" ON "CustomerInquiry"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaInquiry_submissionId_key" ON "MediaInquiry"("submissionId");

-- CreateIndex
CREATE INDEX "MediaInquiry_submissionId_idx" ON "MediaInquiry"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "EventOrganizerInquiry_submissionId_key" ON "EventOrganizerInquiry"("submissionId");

-- CreateIndex
CREATE INDEX "EventOrganizerInquiry_submissionId_idx" ON "EventOrganizerInquiry"("submissionId");

-- CreateIndex
CREATE INDEX "EventOrganizerInquiry_startAt_idx" ON "EventOrganizerInquiry"("startAt");

-- CreateIndex
CREATE INDEX "EventOrganizerInquiry_endAt_idx" ON "EventOrganizerInquiry"("endAt");

-- CreateIndex
CREATE INDEX "ContactSubmissionNote_submissionId_idx" ON "ContactSubmissionNote"("submissionId");

-- CreateIndex
CREATE INDEX "ContactSubmissionNote_createdById_idx" ON "ContactSubmissionNote"("createdById");

-- CreateIndex
CREATE INDEX "ContactSubmissionNote_deletedAt_idx" ON "ContactSubmissionNote"("deletedAt");

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "ContactSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInquiry" ADD CONSTRAINT "CustomerInquiry_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaInquiry" ADD CONSTRAINT "MediaInquiry_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOrganizerInquiry" ADD CONSTRAINT "EventOrganizerInquiry_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSubmissionNote" ADD CONSTRAINT "ContactSubmissionNote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

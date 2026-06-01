"use client";

import { useEffect } from "react";
import { EarlyAccessCtaSection } from "./sections/EarlyAccessCtaSection";
import LandingLayout from "@/layouts/LandingLayout";
import { scrollToSection } from "@/lib/utils";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "1. Information We Collect",
      subtitle: "1.1 Information You Provide Directly",
      content:
        "When you register and use Sorene, we collect information you provide, including:",
      items: [
        "Account information: name, email address, password",
        "Profile and assessment data: responses to psychometric assessments, questionnaires, and the Sorene DNA profile inputs",
        "Financial and lifestyle self-report data: general financial readiness, lifestyle preferences, work style, and similar inputs used to personalize business recommendations",
        "Uploaded documents: CV or resume files submitted for parsing",
        "Business plan content: text, data, and financial projections you enter into the plan builder",
        "Communications: messages you send to us at contact@sorene.ai or through support channels",
      ],
    },
    {
      subtitle: "1.2 Information We Collect Automatically",
      content: "When you use the Services, we automatically collect:",
      items: [
        "Usage data: pages visited, features used, time spent, clicks, and navigation patterns",
        "Device and technical data: IP address, browser type, operating system, and device identifiers",
        "Cookies and similar tracking technologies: session cookies, analytics cookies, and preference cookies (see Section 6)",
      ],
    },
    {
      subtitle: "1.3 Information From Third Parties",
      content:
        "We may receive information from third-party services you connect to Sorene, such as authentication providers (e.g., Google OAuth). We only collect what is necessary to provide the Services.",
    },
    {
      title: "2. How We Use Your Information",
      content: "We use the information we collect to:",
      items: [
        "Provide, personalize, and improve the Services, including generating your Sorene DNA profile and business recommendations",
        "Process payments and manage your subscription",
        "Send transactional emails (account confirmations, password resets, billing notices)",
        "Send product updates, newsletters, and promotional communications (you may opt out at any time)",
        "Analyze usage patterns to improve platform features and user experience",
        "Detect and prevent fraud, abuse, and security incidents",
        "Comply with legal obligations",
      ],
      footer:
        "We do not sell your personal information to third parties. We do not use your assessment or profile data to make automated decisions that produce legal or similarly significant effects without human review.",
    },
    {
      title: "3. How We Share Your Information",
      content: "We may share your information with:",
      items: [
        "Service providers: trusted third-party vendors who assist us in operating the platform (e.g., cloud hosting, payment processing, email delivery, analytics). These providers are contractually required to protect your data and use it only to perform services on our behalf.",
        "AI/LLM providers: We use large language model APIs to power certain platform features. Input data sent to these APIs is subject to those providers' data processing agreements.",
        "Legal requirements: We may disclose information if required to do so by law, court order, or government authority, or to protect the rights, safety, or property of Sorene, our users, or the public.",
        "Business transfers: In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you before your data becomes subject to a different privacy policy.",
      ],
      footer:
        "We do not share your psychometric assessment responses, Sorene DNA profile data, or CV content with any third party for marketing or advertising purposes.",
    },
    {
      title: "4. Data Retention",
      content:
        "We retain your personal information for as long as your account is active or as needed to provide you with the Services. If you delete your account, we will delete or anonymize your personal information within 90 days, except where we are required to retain it for legal, regulatory, or legitimate business purposes (such as tax records or fraud prevention).\nAggregated, anonymized data derived from user interactions may be retained indefinitely for product improvement and research purposes.",
    },
    {
      title: "5. Your Rights and Choices",
      content:
        "Depending on your location and applicable law, you may have the following rights regarding your personal data:",
      items: [
        "Access: Request a copy of the personal information we hold about you",
        "Correction: Request correction of inaccurate or incomplete information",
        "Deletion: Request deletion of your personal information (subject to legal retention requirements)",
        "Portability: Request your data in a structured, machine-readable format",
        "Objection / Restriction: Object to or request restriction of certain processing activities",
        "Opt-out of marketing: Unsubscribe from marketing emails at any time via the unsubscribe link or by emailing contact@sorene.ai",
      ],
      footer:
        "To exercise any of these rights, please contact us at contact@sorene.ai. We will respond within 30 days. We may need to verify your identity before processing your request.",
    },
    {
      title: "6. Cookies and Tracking Technologies",
      content: "We use cookies and similar technologies to:",
      items: [
        "Keep you logged in to your account (session cookies)",
        "Remember your preferences",
        "Analyze how users interact with the platform (analytics cookies)",
      ],
      footer:
        'You can control cookies through your browser settings. Disabling cookies may affect certain features of the Services. We do not currently respond to "Do Not Track" signals, but we will update this policy if our practices change.',
    },
    {
      title: "7. Data Security",
      content:
        "We implement reasonable administrative, technical, and physical safeguards to protect your personal information against unauthorized access, loss, misuse, or alteration. These measures include encrypted data transmission (TLS/HTTPS), access controls, and secure cloud infrastructure.\nHowever, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security, and you use the Services at your own risk. If you believe your account has been compromised, please contact us immediately at contact@sorene.ai.",
    },
    {
      title: "8. Children's Privacy",
      content:
        "The Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from anyone under 18. If we become aware that we have inadvertently collected such information, we will take steps to delete it promptly. If you believe we have collected information from a minor, please contact us at contact@sorene.ai.",
    },
    {
      title: "9. International Users",
      content:
        "Sorene, Inc. is incorporated in the State of Delaware and operates from the United States. If you are accessing the Services from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your country.\nIf you are located in the European Economic Area (EEA), United Kingdom, or other jurisdictions with applicable data transfer restrictions, by using the Services you consent to the transfer of your information to the United States in accordance with this Privacy Policy.",
    },
    {
      title: "10. Third-Party Links and Services",
      content:
        "The Services may contain links to third-party websites, tools, or services (such as tools recommended in our Tools Hub). This Privacy Policy does not apply to those third parties. We encourage you to review the privacy policies of any third-party services before providing them with your information.",
    },
    {
      title: "11. Changes to This Privacy Policy",
      content:
        "We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of material changes by email or by posting a prominent notice on the platform at least 14 days before the changes take effect. Your continued use of the Services after the effective date of the revised policy constitutes your acceptance of the changes.",
    },
    {
      title: "12. Contact Us",
      content: (
        <>
          <p>
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="mt-4 font-medium text-neutral-900">
            <p>Sorene, Inc.</p>
            <p>
              Email: <span className="text-amber-500">contact@sorene.ai</span>
            </p>
            <p>
              Website: <span className="text-amber-500">www.sorene.ai</span>
            </p>
          </div>
        </>
      ),
    },
  ];

  useEffect(() => {
    scrollToSection("header-logo");
  }, []);

  return (
    <LandingLayout>
      <div className="flex flex-col min-h-screen w-full bg-white items-center">
        <main className="w-full max-w-[1006px] px-6 py-16">
          {/* Header */}
          <div id="header" className="flex justify-center">
            <div className="mb-12 text-center">
              {/* Badge */}
              <div className="mb-6 flex justify-center">
                <div className="flex items-center justify-center rounded-full px-4 h-[36px] text-[13px] text-neutral-700 border border-neutral-200 bg-white">
                  Effective Date:
                  <span className="text-amber-400 ml-1 font-medium">
                    April 1, 2026
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="mb-6 text-[48px] lg:text-[64px] font-semibold text-neutral-900 tracking-tight">
                Privacy Policy
              </h1>

              {/* Subtitle */}
              <p className="text-neutral-500 text-[18px] text-start leading-7 max-w-[920px] mx-auto">
                Sorene, Inc. ("Sorene," "we," "us," or "our") is committed to
                protecting your personal information. This Privacy Policy
                explains what data we collect, how we use it, and your rights
                regarding your data when you use the Sorene platform and related
                services ("Services").
              </p>
              <p className="text-neutral-500 text-[18px] text-start leading-7 max-w-[920px] mx-auto">
                By using our Services, you acknowledge that you have read and
                understood this Privacy Policy.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-12 text-left">
            {sections.map((section, index) => (
              <section key={index}>
                {section.title && (
                  <h2 className="mb-4 text-[24px] font-semibold text-[#101010]">
                    {section.title}
                  </h2>
                )}
                {section.subtitle && (
                  <h3 className="mb-3 text-[18px] font-medium text-[#101010]">
                    {section.subtitle}
                  </h3>
                )}
                {typeof section.content === "string" ? (
                  <p className="text-[#878787] text-base leading-7 whitespace-pre-line">
                    {section.content}
                  </p>
                ) : (
                  <div className="text-[#878787] text-base leading-7">
                    {section.content}
                  </div>
                )}
                {section.items && (
                  <ul className="mt-4 space-y-3">
                    {section.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-[#878787] text-base leading-7"
                      >
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.footer && (
                  <p className="mt-4 text-[#878787] text-base leading-7 font-medium">
                    {section.footer}
                  </p>
                )}
              </section>
            ))}
          </div>
        </main>

        <EarlyAccessCtaSection />
      </div>
    </LandingLayout>
  );
}

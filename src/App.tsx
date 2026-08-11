import { useEffect, useMemo, useState } from "react";
import { FirstBootPanel } from "./components/FirstBootPanel";
import { DataMigrationPanel } from "./components/DataMigrationPanel";
import { DistroComparison } from "./components/DistroComparison";
import { HardwarePanel } from "./components/HardwarePanel";
import { Layout } from "./components/Layout";
import { LiveTestPanel } from "./components/LiveTestPanel";
import { MediaGuide } from "./components/MediaGuide";
import { PassportPanel } from "./components/PassportPanel";
import { Questionnaire } from "./components/Questionnaire";
import { ReadinessPanel } from "./components/ReadinessPanel";
import { RecommendationResults } from "./components/RecommendationResults";
import { SoftwareAssessmentPanel } from "./components/SoftwareAssessment";
import { SupportPanel } from "./components/SupportPanel";
import { createDefaultPassport } from "./domain/defaults";
import { hardwareClasses } from "./data/hardware";
import type {
  AdvisorAnswers,
  AppSection,
  DataMigrationSelections,
  HardwareProfile,
  LiveTestResults,
  Locale,
  MediaProgress,
  MigrationPassport,
  SoftwareSelections
} from "./domain/types";
import { assessLiveReadiness, assessSoftware } from "./engine/assess";
import { recommendDistros } from "./engine/recommend";
import { assessMigrationReadiness } from "./engine/readiness";
import { clearPassport, loadPassport, savePassport } from "./passport/storage";
import { factsForHardwareClass } from "./hardware/integration";
import { sectionLabel } from "./i18n";

const appSections: AppSection[] = [
  "advisor",
  "compare",
  "software",
  "hardware",
  "live",
  "readiness",
  "data",
  "media",
  "passport",
  "first_boot"
];

function sectionFromLocation(): AppSection {
  const candidate = new URLSearchParams(window.location.search).get("step");
  return appSections.includes(candidate as AppSection)
    ? (candidate as AppSection)
    : "advisor";
}

function stamp(passport: MigrationPassport): MigrationPassport {
  return { ...passport, updatedAt: new Date().toISOString() };
}

export function App() {
  const [passport, setPassport] = useState<MigrationPassport>(
    () => loadPassport() ?? createDefaultPassport()
  );
  const [section, setSection] = useState<AppSection>(sectionFromLocation);
  const [supportOpen, setSupportOpen] = useState(false);
  const [advisorComplete, setAdvisorComplete] = useState(
    () => passport.selectedDistroId !== null
  );

  const recommendations = useMemo(
    () => recommendDistros(passport.answers),
    [passport.answers]
  );
  const softwareAssessment = useMemo(
    () => assessSoftware(passport.softwareSelections),
    [passport.softwareSelections]
  );
  const liveReadiness = useMemo(
    () => assessLiveReadiness(passport.liveTests),
    [passport.liveTests]
  );
  const migrationReadiness = useMemo(
    () => assessMigrationReadiness(passport, softwareAssessment),
    [passport, softwareAssessment]
  );

  useEffect(() => {
    document.documentElement.lang = passport.locale;
    try {
      savePassport(passport);
    } catch {
      // The app remains usable if storage is disabled or full.
    }
  }, [passport]);

  useEffect(() => {
    const handleHistory = () => {
      setSupportOpen(false);
      setSection(sectionFromLocation());
    };
    window.addEventListener("popstate", handleHistory);
    return () => window.removeEventListener("popstate", handleHistory);
  }, []);

  useEffect(() => {
    document.title = supportOpen
      ? "Support | Linux Migration Companion"
      : section === "advisor"
        ? passport.locale === "de"
          ? "Linux Migration Companion | Windows-zu-Linux-Planung"
          : "Linux Migration Companion | Windows-to-Linux Planning"
      : `${sectionLabel(passport.locale, section)} | Linux Migration Companion`;
  }, [passport.locale, section, supportOpen]);

  const navigate = (nextSection: AppSection) => {
    setSupportOpen(false);
    setSection(nextSection);
    const url = new URL(window.location.href);
    url.searchParams.set("step", nextSection);
    window.history.pushState({ step: nextSection }, "", url);
    window.requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const showSupport = () => {
    setSupportOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const updateAnswers = (answers: AdvisorAnswers) => {
    setPassport((current) =>
      stamp({
        ...current,
        answers,
        hardware: {
          ...current.hardware,
          gpuVendor: answers.gpuVendor
        }
      })
    );
  };

  const updateLocale = (locale: Locale) => {
    setPassport((current) => stamp({ ...current, locale }));
  };

  const updateSoftware = (softwareSelections: SoftwareSelections) => {
    setPassport((current) => stamp({ ...current, softwareSelections }));
  };

  const updateHardware = (hardware: HardwareProfile) => {
    setPassport((current) =>
      stamp({
        ...current,
        hardware,
        answers: { ...current.answers, gpuVendor: hardware.gpuVendor }
      })
    );
  };

  const updateLiveTests = (liveTests: LiveTestResults) => {
    setPassport((current) => {
      const evidence = { ...current.hardware.evidence };
      for (const definition of hardwareClasses) {
        if (!definition.liveTestId) continue;
        const status = liveTests[definition.liveTestId];
        const currentEvidence = evidence[definition.id];
        const state =
          status === "works"
            ? "live_verified"
            : status === "issue"
              ? "failed_test"
              : status === "not_applicable"
                ? "not_applicable"
                : ["live_verified", "failed_test", "not_applicable"].includes(
                      currentEvidence.state
                    )
                  ? factsForHardwareClass(
                        current.hardware.snapshot,
                        definition.id
                      ).length > 0 ||
                      (definition.id === "external_monitors" &&
                        (current.hardware.snapshot?.snapshot.system
                          .connectedDisplays ?? 0) > 1)
                    ? "known_fact"
                    : "unknown"
                  : currentEvidence.state;
        evidence[definition.id] = {
          ...currentEvidence,
          state,
          required: status === "not_applicable" ? false : currentEvidence.required
        };
      }
      return stamp({
        ...current,
        liveTests,
        hardware: { ...current.hardware, evidence }
      });
    });
  };

  const updateMedia = (mediaProgress: MediaProgress) => {
    setPassport((current) => stamp({ ...current, mediaProgress }));
  };

  const updateComparison = (comparisonDistroIds: string[]) => {
    setPassport((current) => stamp({ ...current, comparisonDistroIds }));
  };

  const updateDataMigration = (dataMigration: DataMigrationSelections) => {
    setPassport((current) => stamp({ ...current, dataMigration }));
  };

  const selectDistro = (selectedDistroId: string) => {
    setPassport((current) => {
      const comparisonDistroIds = current.comparisonDistroIds.includes(
        selectedDistroId
      )
        ? current.comparisonDistroIds
        : [
            selectedDistroId,
            ...current.comparisonDistroIds.filter(
              (id) => id !== selectedDistroId
            )
          ].slice(0, 3);
      return stamp({ ...current, selectedDistroId, comparisonDistroIds });
    });
  };

  const analyze = () => {
    const selectedDistroId =
      passport.selectedDistroId ?? recommendations[0].distro.id;
    setPassport((current) =>
      stamp({
        ...current,
        selectedDistroId,
        comparisonDistroIds: current.comparisonDistroIds.length
          ? current.comparisonDistroIds
          : recommendations.slice(0, 3).map((item) => item.distro.id)
      })
    );
    setAdvisorComplete(true);
    window.requestAnimationFrame(() => document.getElementById("results-title")?.focus());
  };

  const reset = () => {
    clearPassport();
    const next = createDefaultPassport();
    next.locale = passport.locale;
    setPassport(next);
    setAdvisorComplete(false);
    setSupportOpen(false);
    setSection("advisor");
    const url = new URL(window.location.href);
    url.searchParams.delete("step");
    window.history.replaceState({ step: "advisor" }, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const importPassport = (nextPassport: MigrationPassport) => {
    setPassport(stamp(nextPassport));
    setAdvisorComplete(nextPassport.selectedDistroId !== null);
  };

  let content;
  switch (section) {
    case "advisor":
      content = advisorComplete ? (
        <RecommendationResults
          locale={passport.locale}
          answers={passport.answers}
          recommendations={recommendations}
          selectedDistroId={passport.selectedDistroId}
          onSelect={selectDistro}
          onEdit={() => setAdvisorComplete(false)}
          onContinue={() => navigate("compare")}
        />
      ) : (
        <Questionnaire
          locale={passport.locale}
          answers={passport.answers}
          onChange={updateAnswers}
          onAnalyze={analyze}
        />
      );
      break;
    case "compare":
      content = (
        <DistroComparison
          locale={passport.locale}
          recommendations={recommendations}
          selectedIds={passport.comparisonDistroIds}
          onChange={updateComparison}
          onContinue={() => navigate("software")}
        />
      );
      break;
    case "software":
      content = (
        <SoftwareAssessmentPanel
          locale={passport.locale}
          selections={passport.softwareSelections}
          onChange={updateSoftware}
          onContinue={() => navigate("hardware")}
        />
      );
      break;
    case "hardware":
      content = (
        <HardwarePanel
          locale={passport.locale}
          hardware={passport.hardware}
          liveTests={passport.liveTests}
          onChange={updateHardware}
          onContinue={() => navigate("live")}
        />
      );
      break;
    case "live":
      content = (
        <LiveTestPanel
          locale={passport.locale}
          results={passport.liveTests}
          onChange={updateLiveTests}
          onContinue={() => navigate("readiness")}
        />
      );
      break;
    case "readiness":
      content = (
        <ReadinessPanel
          locale={passport.locale}
          passport={passport}
          readiness={migrationReadiness}
          software={softwareAssessment}
          onContinue={() => navigate("data")}
        />
      );
      break;
    case "data":
      content = (
        <DataMigrationPanel
          locale={passport.locale}
          selections={passport.dataMigration}
          onChange={updateDataMigration}
          onContinue={() => navigate("media")}
        />
      );
      break;
    case "media":
      content = (
        <MediaGuide
          locale={passport.locale}
          selectedDistroId={passport.selectedDistroId}
          progress={passport.mediaProgress}
          onChange={updateMedia}
          onContinue={() => navigate("passport")}
        />
      );
      break;
    case "passport":
      content = (
        <PassportPanel
          locale={passport.locale}
          passport={passport}
          recommendations={recommendations}
          softwareAssessment={softwareAssessment}
          liveReadiness={liveReadiness}
          migrationReadiness={migrationReadiness}
          onImport={importPassport}
          onContinue={() => navigate("first_boot")}
        />
      );
      break;
    case "first_boot":
      content = <FirstBootPanel locale={passport.locale} passport={passport} />;
      break;
  }

  if (supportOpen) {
    content = <SupportPanel locale={passport.locale} />;
  }

  return (
    <Layout
      locale={passport.locale}
      section={section}
      supportOpen={supportOpen}
      onLocaleChange={updateLocale}
      onSectionChange={navigate}
      onSupport={showSupport}
      onReset={reset}
    >
      {content}
    </Layout>
  );
}

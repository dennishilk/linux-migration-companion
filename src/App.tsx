import { useEffect, useMemo, useState } from "react";
import { FirstBootPanel } from "./components/FirstBootPanel";
import { HardwarePanel } from "./components/HardwarePanel";
import { Layout } from "./components/Layout";
import { LiveTestPanel } from "./components/LiveTestPanel";
import { MediaGuide } from "./components/MediaGuide";
import { PassportPanel } from "./components/PassportPanel";
import { Questionnaire } from "./components/Questionnaire";
import { RecommendationResults } from "./components/RecommendationResults";
import { SoftwareAssessmentPanel } from "./components/SoftwareAssessment";
import { createDefaultHardware, createDefaultPassport } from "./domain/defaults";
import type {
  AdvisorAnswers,
  AppSection,
  HardwareProfile,
  LiveTestResults,
  Locale,
  MediaProgress,
  MigrationPassport,
  SoftwareSelections
} from "./domain/types";
import { assessLiveReadiness, assessSoftware } from "./engine/assess";
import { recommendDistros } from "./engine/recommend";
import { clearPassport, loadPassport, savePassport } from "./passport/storage";

function stamp(passport: MigrationPassport): MigrationPassport {
  return { ...passport, updatedAt: new Date().toISOString() };
}

export function App() {
  const [passport, setPassport] = useState<MigrationPassport>(
    () => loadPassport() ?? createDefaultPassport()
  );
  const [section, setSection] = useState<AppSection>("advisor");
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

  useEffect(() => {
    document.documentElement.lang = passport.locale;
    try {
      savePassport(passport);
    } catch {
      // The app remains usable if storage is disabled or full.
    }
  }, [passport]);

  const navigate = (nextSection: AppSection) => {
    setSection(nextSection);
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
        hardware:
          answers.gpuVendor === current.hardware.gpuVendor
            ? current.hardware
            : createDefaultHardware(answers.gpuVendor)
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
    setPassport((current) => stamp({ ...current, liveTests }));
  };

  const updateMedia = (mediaProgress: MediaProgress) => {
    setPassport((current) => stamp({ ...current, mediaProgress }));
  };

  const selectDistro = (selectedDistroId: string) => {
    setPassport((current) => stamp({ ...current, selectedDistroId }));
  };

  const analyze = () => {
    if (!passport.selectedDistroId) selectDistro(recommendations[0].distro.id);
    setAdvisorComplete(true);
    window.requestAnimationFrame(() => document.getElementById("results-title")?.focus());
  };

  const reset = () => {
    clearPassport();
    const next = createDefaultPassport();
    next.locale = passport.locale;
    setPassport(next);
    setAdvisorComplete(false);
    navigate("advisor");
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
          onContinue={() => navigate("software")}
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
          onImport={importPassport}
          onClear={reset}
          onContinue={() => navigate("first_boot")}
        />
      );
      break;
    case "first_boot":
      content = <FirstBootPanel locale={passport.locale} passport={passport} />;
      break;
  }

  return (
    <Layout
      locale={passport.locale}
      section={section}
      onLocaleChange={updateLocale}
      onSectionChange={navigate}
    >
      {content}
    </Layout>
  );
}

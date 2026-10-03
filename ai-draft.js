/* Janel's Way — template-based AI Note Assistant.
 * Works with NO api keys: it composes a professional ABA session-note draft
 * from the data the therapist enters (goals, behaviors/tallies, observations).
 * It does NOT listen to calls or use a language model. See
 * integrations/ai-notes.md for the future server-side transcription + LLM plan.
 */
(function () {
  function buildNoteDraft(input) {
    const {
      clientInitials, date, durationMin, participants,
      goals,        // array of goal titles addressed
      behaviors,    // array of { behavior, count }
      abc           // free-text ABC narrative / observations
    } = input;

    const lines = [];
    lines.push(`SESSION NOTE — ${clientInitials || "Client"} — ${date || new Date().toLocaleDateString()}`);
    lines.push("");
    lines.push(`Duration: ${durationMin || "—"} min   Participants: ${(participants || []).join(", ") || "—"}`);
    lines.push("");
    lines.push("GOALS ADDRESSED:");
    if (goals && goals.length) goals.forEach(g => lines.push(`- ${g}`));
    else lines.push("- (none selected)");
    lines.push("");
    lines.push("OBJECTIVE (data observed):");
    if (behaviors && behaviors.length) {
      behaviors.forEach(b => lines.push(`- ${b.behavior}: ${b.count} occurrence(s)`));
    } else {
      lines.push("- No behavior data recorded this session.");
    }
    if (abc && abc.trim()) {
      lines.push("");
      lines.push("ABC / OBSERVATIONS:");
      lines.push(abc.trim());
    }
    lines.push("");
    lines.push("ASSESSMENT:");
    lines.push("(Therapist: summarize progress toward the goals above, noting any patterns in the data.)");
    lines.push("");
    lines.push("PLAN:");
    lines.push("(Therapist: next steps, adjustments, and what to target in the next session.)");
    lines.push("");
    lines.push("— Draft composed by the Janel's Way AI Note Assistant from session data. Review and edit before submitting. —");
    return lines.join("\n");
  }

  window.JW_AI = { buildNoteDraft };
})();

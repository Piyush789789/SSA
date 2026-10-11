package com.ssa.schoolerp;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Question-wise marks: setting a paper's questions, entering marks per question, Excel import, student view. */
class ExamQuestionsTest extends ApiTestSupport {

    private static final String ROHIT = "STU-2026-0503"; // demo student, 5-B
    private static final String SCIENCE_6A = "SCH-009";   // Test 2 Science 6-A (50 marks), taught by the demo teacher

    private static final List<Map<String, Object>> FIVE_TENS = List.of(
            Map.of("label", "Q1", "maxMarks", 10), Map.of("label", "Q2", "maxMarks", 10),
            Map.of("label", "Q3", "maxMarks", 10), Map.of("label", "Q4", "maxMarks", 10),
            Map.of("label", "Q5", "maxMarks", 10));

    @Test
    void studentsSeeTheirMarksQuestionByQuestion() throws Exception {
        JsonNode result = data(getAs(student(), "/api/results/students/" + ROHIT).andExpect(status().isOk()));
        JsonNode maths = null;
        for (JsonNode s : result.get("subjects")) {
            if (s.get("subject").asText().equals("Mathematics") && s.get("examId").asText().equals("EXM-2026-UT1")) maths = s;
        }
        assertThat(maths).isNotNull();
        assertThat(maths.get("questions")).hasSize(5);
        if (!maths.get("absent").asBoolean()) {
            double sum = 0;
            for (JsonNode q : maths.get("questionMarks")) sum += q.asDouble();
            assertThat(sum).isEqualTo(maths.get("obtainedMarks").asDouble());
        }
    }

    @Test
    void questionsMustAddUpToThePaperAndCannotBreakEnteredMarks() throws Exception {
        String teacher = teacher();
        putAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/questions", Map.of("questions",
                List.of(Map.of("label", "Q1", "maxMarks", 10)))).andExpect(status().isBadRequest()); // 10 != 50
        putAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/questions", Map.of("questions", FIVE_TENS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questions.length()").value(5));
        // SCH-008 already has question-wise marks: changing its questions to a different count is refused.
        putAs(teacher, "/api/exam-schedules/SCH-008/questions", Map.of("questions",
                List.of(Map.of("label", "Q1", "maxMarks", 50)))).andExpect(status().isConflict());
        putAs(student(), "/api/exam-schedules/" + SCIENCE_6A + "/questions", Map.of("questions", FIVE_TENS))
                .andExpect(status().isForbidden());
    }

    @Test
    void marksEnteredPerQuestionAreTotalledAndChecked() throws Exception {
        String teacher = teacher();
        putAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/questions", Map.of("questions", FIVE_TENS))
                .andExpect(status().isOk());
        String studentId = data(getAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/marks"))
                .get("rows").get(0).get("studentId").asText();

        putAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/marks", Map.of("submit", false, "entries", List.of(
                Map.of("studentId", studentId, "absent", false, "clear", false,
                        "questionMarks", Arrays.asList(8, 10, 6.5, null, 3)))))
                .andExpect(status().isOk());
        JsonNode row = data(getAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/marks")).get("rows").get(0);
        assertThat(row.get("obtainedMarks").asDouble()).isEqualTo(27.5);
        assertThat(row.get("questionMarks").get(3).isNull()).isTrue(); // not attempted stays blank, not 0

        putAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/marks", Map.of("submit", false, "entries", List.of(
                Map.of("studentId", studentId, "absent", false, "clear", false,
                        "questionMarks", List.of(11, 0, 0, 0, 0))))) // Q1 is out of 10
                .andExpect(status().isBadRequest());
    }

    @Test
    void marksAreImportedFromASpreadsheetByStudentIdOrRoll() throws Exception {
        String teacher = teacher();
        putAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/questions", Map.of("questions", FIVE_TENS))
                .andExpect(status().isOk());
        JsonNode rows = data(getAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/marks")).get("rows");
        String first = rows.get(0).get("studentId").asText();
        int secondRoll = rows.get(1).get("rollNumber").asInt();
        String third = rows.get(2).get("studentId").asText();

        Map<String, Object> body = Map.of("dryRun", true, "rows", List.of(
                Map.of("row", 2, "studentId", first.toLowerCase(), "absent", false, "questionMarks", List.of(9, 9, 9, 9, 9)),
                Map.of("row", 3, "rollNumber", secondRoll, "absent", true),
                Map.of("row", 4, "studentId", "STU-9999-0000", "absent", false, "total", 20),
                Map.of("row", 5, "studentId", third, "absent", false, "questionMarks", List.of(12, 0, 0, 0, 0))));
        JsonNode dry = data(postAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/marks/import", body)
                .andExpect(status().isOk()));
        assertThat(dry.get("valid").asInt()).isEqualTo(2);
        assertThat(dry.get("failed").asInt()).isEqualTo(2);
        assertThat(data(getAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/marks")).get("rows").get(0)
                .get("obtainedMarks")).isEqualTo(rows.get(0).get("obtainedMarks")); // dry run saved nothing

        JsonNode real = data(postAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/marks/import",
                Map.of("dryRun", false, "rows", ((List<?>) body.get("rows")))).andExpect(status().isOk()));
        assertThat(real.get("saved").asInt()).isEqualTo(2);
        JsonNode after = data(getAs(teacher, "/api/exam-schedules/" + SCIENCE_6A + "/marks")).get("rows");
        assertThat(after.get(0).get("obtainedMarks").asDouble()).isEqualTo(45);
        assertThat(after.get(0).get("status").asText()).isEqualTo("Draft");
        assertThat(after.get(1).get("absent").asBoolean()).isTrue();
    }
}

// services/flowableService.js
const axios = require("axios");

const flowable = axios.create({
  baseURL: process.env.FLOWABLE_BASE_URL,
  auth: {
    username: process.env.FLOWABLE_USER,
    password: process.env.FLOWABLE_PASS
  }
});

exports.startProcess = async (reviewId) => {
  return flowable.post("/runtime/process-instances", {
    processDefinitionKey: "aiApprovalWorkflow",
    variables: [{ name: "reviewId", value: reviewId }]
  });
};

exports.completeTask = async (taskId, decision) => {
  return flowable.post(`/runtime/tasks/${taskId}`, {
    action: "complete",
    variables: [{ name: "decision", value: decision }]
  });
};

exports.getTasks = async () => {
  return flowable.get("/runtime/tasks");
};

exports.getTasksByReviewId = async (reviewId) => {
  return flowable.get(
    `/runtime/tasks?processVariables=reviewId_${reviewId}`
  );
};
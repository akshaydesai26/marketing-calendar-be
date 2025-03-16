const axios = require("axios");

const createPrompt = (message, eventsList) => {
  const dates = getDates();
  return `You are a marketing consultant. Company details: ${message} <company details ended>\\n\\nTask: Generate four actionable Instagram post ideas for the company to use between ${dates.date1} and ${dates.date2}. The posts should be tied to relevant dates or themes within the date range, and can include at least 2 of the following occasions: ${eventsList}. Feel free to suggest other dates or themes if they fit better with the brand.\\n\\nDesired output: Provide the post ideas in a json format, including a suggested date for posting, a brief description of the post’s content, and a no hashtags. Focus on posts that promote engagement. Do not add any other information in the response. Example response: [{date: XYZ, post-idea: XYZ}, {date: XYZ2, post-idea: XYZ2}]`
};

const createAPIBody = (message, eventsList) => {
  return {"model":"google/gemma-2-2b-it","messages":[{"role":"user","content":`${createPrompt(message, eventsList)}`}],"temperature":0.5,"max_tokens":2048,"top_p":0.7}
}

const preprocessResponse = (response) => {
  const cleanedString = response.replace(/```json\n|\n```|\n/g, '');
  return JSON.parse(cleanedString);
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDates = () => {
  const today = new Date();
  const date1 = new Date(today);
  date1.setDate(today.getDate() + 1);
  const date2 = new Date(date1);
  date2.setDate(date1.getDate() + 30);
  return {
    date1: formatDate(date1),
    date2: formatDate(date2)
  };
};

exports.handler = async (event) => {

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Headers": "Content-Type", // Allow specific headers
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allow specific methods
      },
      body: "",
    };
  }


    try {
      const message = JSON.parse(event?.body)?.prompt;
      const eventsList = JSON.parse(event?.body)?.eventsList;
      if(!message) {
        throw Error('Prompt is required');
      }
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/google/gemma-2-2b-it/v1/chat/completions`,
        createAPIBody(message, eventsList),
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const ai_res = response?.data?.choices?.[0]?.message?.content;
      if(!ai_res) {
        throw Error('Failed to get proper response');
      }
      const preprocessedResponse = preprocessResponse(ai_res);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow all origins
          "Access-Control-Allow-Headers": "Content-Type", // Allow specific headers
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS" // Allow specific methods
        },
        body: JSON.stringify({ message: preprocessedResponse }),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow all origins
          "Access-Control-Allow-Headers": "Content-Type", // Allow specific headers
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS" // Allow specific methods
        },
        body: JSON.stringify({ message: error.message || 'Failed to call Hugging Face API' }),
      };
    }
  };
  
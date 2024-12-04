const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const router = express.Router();
const { validationResult, body } = require("express-validator");
const { readPdf } = require("./fungsi");

const apiKey = "AIzaSyAlPHksmC2zpGpRrFX23Wr7n8ADkEXDzvM";
const genAI = new GoogleGenerativeAI(apiKey);

const generation_config = {
  temperature: 1,
  top_p: 0.95,
  top_k: 64,
  max_output_tokens: 8192,
  response_mime_type: "text/plain",
};

router.route("/").get(async (req, res) => {
  res.json({
    message: "hello world",
  });
});

router
  .route("/api/ai/order")
  .post(body(["message", "id_package"]).notEmpty(), async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        message: "Data invalid",
      });
    }

    if (req.headers.authorization == undefined) {
      return res.status(400).json({
        message: "Token required",
      });
    }

    if (!req.headers.authorization.includes("Bearer ")) {
      return res.status(400).json({
        message: "Token invalid",
      });
    }

    const token = req.headers.authorization;
    const userInput = req.body.message;
    const id_package = req.body.id_package;

    try {
      const apiResponse = await fetch(
        `https://be.storease.id/api/package/${id_package}`,
        {
          method: "get",
          headers: {
            Authorization: token,
          },
        }
      );
      if (apiResponse.status != 200) {
        const errMsg = (await apiResponse.json()).message;
        throw new Error(errMsg);
      }

      const package_details = JSON.stringify((await apiResponse.json()).data);

      let source_context_order = "";
      const pdf_files = await (
        await fetch(`https://be.storease.id/api/document/${id_package}`, {
          method: "get",
          headers: {
            Authorization: token,
          },
        })
      ).json();

      for (let index = 0; index < pdf_files.length; index++) {
        const pdf_text = await readPdf(pdf_files[index]);
        console.log(pdf_text);
        source_context_order += `\n\n${pdf_text}`;
      }
      source_context_order += `\n\nPackage Details berformat json: ${package_details} \nini adalah data paket yang customer pilih ${package_details}`;
      console.log(source_context_order);

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction:
          "anda adalah pegawai customer service dari perusahaan Storease yang bergerak di bidang wedding organizer. Anda akan menjelaskan dan merekomendasikan mengenai paket pernikahan yang sudah diberikan kepada anda. Anda juga diberikan plaintext dari dokumen pesanan pernikahan dan anda bisa menjawab pertanyaan pelanggan mengenai dokumen pesanan pernikahan mereka ",
        generationConfig: generation_config,
      });

      const chat_session = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: "Hello, saya sedang mencari alat untuk kebutuhan pernikahan.",
              },
            ],
          },
          {
            role: "model",
            parts: [
              {
                text: source_context_order,
              },
            ],
          },
        ],
      });

      const aiResponse = await chat_session.sendMessage(userInput);
      return res.json(aiResponse.response.text());
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        message: error.stack,
      });
    }
  });

router
  .route("/api/ai/homepage")
  .post(body(["message"]).notEmpty(), async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        message: "Data invalid",
      });
    }

    if (req.headers.authorization == undefined) {
      return res.status(400).json({
        message: "Token required",
      });
    }

    if (!req.headers.authorization.includes("Bearer ")) {
      return res.status(400).json({
        message: "Token invalid",
      });
    }

    const token = req.headers.authorization;
    const userInput = req.body.message;

    try {
      const apiResponse = await fetch(`https://be.storease.id/api/homepage`, {
        method: "get",
        headers: {
          Authorization: token,
        },
      });
      if (apiResponse.status != 200) {
        const errMsg = (await apiResponse.json()).message;
        throw new Error(errMsg);
      }

      const package_details = (await apiResponse.json()).data;
      console.log(package_details);

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction:
          "anda adalah pegawai customer service dari perusahaan Storease yang bergerak di bidang wedding organizer. Anda akan menjelaskan dan merekomendasikan mengenai paket pernikahan yang sudah diberikan kepada anda. Anda juga diberikan plaintext dari dokumen pesanan pernikahan dan anda bisa menjawab pertanyaan pelanggan mengenai dokumen pesanan pernikahan mereka ",
        generationConfig: generation_config,
      });

      const chat_session = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: "Hello, saya sedang merencanakan pernikahan!",
              },
            ],
          },
          {
            role: "model",
            parts: [
              {
                text: `Berikut data paket kami dalam bentuk string json(harap parse dulu agar dapat dibaca): ${JSON.stringify(
                  package_details
                )}`,
              },
            ],
          },
        ],
      });

      const aiResponse = await chat_session.sendMessage(userInput);
      return res.json(aiResponse.response.text());
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        message: error.stack,
      });
    }
  });

app.listen(3000, () => {
  console.log("berjalan");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ extended: true }));
app.use(router);

router.route("*").all((req, res) => {
  res.json({
    message: "path not found",
  });
});

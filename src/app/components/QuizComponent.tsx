"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
interface Quiz {
  ID: number;
  category: string;
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
}

const QuizComp = () => {
  const [data, setData] = useState<Quiz[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [nextDisabled, setNextDisabled] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [nextVisible, setNextVisible] = useState(false);
  const [answered, setAnswered] = useState<number[]>([]);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const [lastQ, setLastQ] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [details, setDetails] = useState<
    {
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }[]
  >([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stored = localStorage.getItem("quizData");
        if (stored) {
          setData(JSON.parse(stored));
        } else {
          const response = await fetch("/quizData.json");
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const data = await response.json();

          const shuffled = data
            .sort(() => Math.random() - 0.5)
            .slice(0, 10) // 設問数を制御
            .map((q: any, index: number) => {
              const choices = [
                q.choices1?.toString() || "",
                q.choices2?.toString() || "",
                q.choices3?.toString() || "",
                q.choices4?.toString() || "",
              ];
              return { ...q, choices, ID: index + 1 };
            });

          setData(shuffled);
          localStorage.setItem("quizData", JSON.stringify(shuffled));
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setLastQ(qIndex === data.length - 1);
  }, [qIndex, data]);

  useEffect(() => {
    setNextVisible(false);
  }, [qIndex, data]);

  const nextQ = () => {
    if (qIndex < data.length - 1) {
      setQIndex(qIndex + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
    setNextDisabled(true);
    setCorrect(null);
  };

  const choose = (index: number) => {
    const choice = data[qIndex].choices[index];
    const answer = data[qIndex].answer;

    const isCorrect = choice === answer;

    setCorrect(isCorrect);
    setSelected(index);
    setNextDisabled(false);

    if (qIndex < data.length - 1) {
      setNextVisible(true);
    }

    if (qIndex === data.length - 1) {
      setNextVisible(false);
    } else {
      setNextVisible(true);
    }

    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    setDetails([
      ...details,
      {
        question: data[qIndex].question,
        userAnswer: choice,
        correctAnswer: answer,
        isCorrect,
      },
    ]);
  };

  const prevQ = () => {
    if (qIndex > 0) {
      setQIndex(qIndex - 1);
      const prevDetails = details[qIndex - 1];

      if (prevDetails) {
        const prevSelected = data[qIndex - 1].choices.indexOf(
          prevDetails.userAnswer
        );
        setSelected(prevSelected);
      }

      const updatedDetails = [...details];
      updatedDetails.pop();
      setDetails(updatedDetails);

      const lastCorrect =
        updatedDetails.length > 0
          ? updatedDetails[updatedDetails.length - 1].isCorrect
          : false;
      if (lastCorrect) {
        setCorrectCount(correctCount - 1);
      }
    }
  };

  const viewResult = () => {
    setFinished(true);
  };

  const retry = () => {
    localStorage.removeItem("quizData");
    window.location.reload();
  };

  const progressStyle = {
    width: `${((qIndex + 1) / data.length) * 100}%`,
    height: "10px",
    backgroundColor: "#4caf50",
    transition: "width 0.5s",
  };

  // スコア計算
  const scorePercentage = Math.floor((correctCount / data.length) * 1000) / 10;

  return (
    <div
      id="qa-box"
      className="py-4 px-5 sm:py-8 sm:px-14 sm:mx-4 border border-slate-300 rounded-2xl"
    >
      {qIndex < data.length && (
        <div className="qa-inner">
          {!finished && (
            <div className="progressLength">
              <p>進捗：{`${qIndex + 1}/${data.length}`}</p>
              <div className="progress-bar mb-8" style={progressStyle}></div>
            </div>
          )}

          {!finished && (
            <div id="qa-title" className="mb-6 font-bold">
              {`Q.${qIndex + 1}：${data[qIndex].question}`}
            </div>
          )}
          {!finished && (
            <div id="qa-choices" className="">
              <ul>
                {data[qIndex].choices.map((choice, index) => (
                  <li
                    key={index}
                    className={`flex justify-between border border-slate-400 p-3 mb-3 cursor-pointer ${
                      nextDisabled || answered.includes(qIndex)
                        ? "cursor-not-allowed"
                        : ""
                    } ${selected === index ? "bg-blue-100" : ""}`}
                    onClick={() => choose(index)}
                  >
                    {choice}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-between mt-8">
            {qIndex > 0 && !finished ? (
              <button
                className="prev inline-block px-3 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base sm:px-4 sm:py-2"
                onClick={prevQ}
              >
                &lt; 前の設問に戻る
              </button>
            ) : (
              <div></div>
            )}
            {nextVisible && !finished ? (
              <div id="qa-next-button">
                <button
                  className="next inline-block px-3 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base sm:px-4 sm:py-2"
                  onClick={nextQ}
                  disabled={nextDisabled}
                >
                  次の質問に進む &gt;
                </button>
              </div>
            ) : (
              <div></div>
            )}
          </div>
          {lastQ && selected !== null && !finished && (
            <div id="qa-next-button" className="flex justify-center my-8">
              <button
                onClick={viewResult}
                className="next block w-1/2 text-center p-4 bg-orange-500 text-white rounded hover:bg-orange-400"
              >
                結果を見る
              </button>
            </div>
          )}
          {finished && (
            <div id="result-box">
              <p className="text-center font-bold text-2xl mb-10">実施結果</p>

              <ul className="mb-5">
                <li className="border-b border-gray-300 pb-3 mb-3">
                  <dl className="flex flex-col md:flex-row md:items-center">
                    <dt className="w-44 font-bold mb-2 md:mb-0 md:mr-4">
                      合否
                    </dt>
                    <dd className="w-full">
                      {correctCount === data.length ? (
                        <span className="bg-green-600 px-6 py-1 text-white text-bold rounded-full inline-block">
                          合格
                        </span>
                      ) : (
                        <span className="bg-red-600 px-6 py-1 text-white text-bold rounded-full inline-block">
                          不合格
                        </span>
                      )}
                      <span className="text-sm block mt-2">
                        合格ライン：スコア100%以上
                      </span>
                    </dd>
                  </dl>
                </li>
                <li className="border-b border-gray-300 pb-3 mb-3">
                  <dl className="flex flex-col md:flex-row md:items-center">
                    <dt className="w-44 font-bold mb-2 md:mb-0 md:mr-4">
                      スコア
                    </dt>
                    <dd className="w-full">
                      <div>
                        <span className="font-bold text-red-500">
                          {scorePercentage}%
                        </span>{" "}
                        / 100%
                      </div>
                      <div>
                        <div className="progressbar bg-gray-300 h-3 w-full">
                          <div
                            className="bg-orange-500 h-3"
                            style={{ width: `${scorePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </dd>
                  </dl>
                </li>
                <li>
                  <dl className="flex flex-col md:flex-row md:items-center">
                    <dt className="w-44 font-bold mb-2 md:mb-0 md:mr-4">
                      各設問の詳細
                    </dt>
                    <dd></dd>
                  </dl>
                </li>
              </ul>

              <div className="mb-20">
                {details.map((detail, index) => (
                  <div key={index} className="answer-card mb-10">
                    <div className="mb-4 font-bold">
                      Q.{index + 1}:
                      {detail.isCorrect ? (
                        <span className="bg-green-600 px-6 py-1 text-white text-bold rounded-full inline-block ml-2">
                          正解
                        </span>
                      ) : (
                        <span className="bg-red-600 px-6 py-1 text-white text-bold rounded-full inline-block ml-2">
                          不正解
                        </span>
                      )}
                    </div>
                    <ul className="flex flex-col text-sm">
                      <li className="bottom-1 border-black">
                        <dl className="table w-full border border-gray-300">
                          <dt className="table-cell w-1/6 bg-gray-100 font-bold p-4 border-r border-gray-300">
                            設問
                          </dt>
                          <dd className="table-cell p-4">{detail.question}</dd>
                        </dl>
                      </li>
                      <li className="bottom-1 border-black">
                        <dl className="table w-full border border-gray-300">
                          <dt className="table-cell w-1/6 bg-gray-100 font-bold p-4 border-r border-gray-300">
                            あなたの回答
                          </dt>
                          <dd className="table-cell p-4">
                            {detail.userAnswer}
                          </dd>
                        </dl>
                      </li>
                      <li className="bottom-1 border-black">
                        <dl className="table w-full border border-gray-300">
                          <dt className="table-cell w-1/6 bg-gray-100 font-bold p-4 border-r border-gray-300">
                            正答
                          </dt>
                          <dd className="table-cell p-4">
                            {detail.correctAnswer}
                          </dd>
                        </dl>
                      </li>
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex justify-center flex-col">
                <button
                  onClick={retry}
                  className="bg-orange-400 hover:bg-orange-300 text-white rounded px-4 py-4 font-bold inline-block w-full md:w-96 mx-auto text-center cursor-pointer"
                >
                  もう一度挑戦する
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizComp;

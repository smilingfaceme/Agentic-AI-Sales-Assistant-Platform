from langchain.memory import ConversationBufferMemory
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain.chains import create_retrieval_chain, ConversationalRetrievalChain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.chains import LLMChain
from langchain_core.messages import HumanMessage, AIMessage
from sqlalchemy import create_engine, Column, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_MODEL", "text-embedding-3-small")

# ---------- init ChromaDB vectorstore wrapper for LangChain ----------
def init_vectorstore():
    # create LangChain embeddings and vectorstore
    embedder = OpenAIEmbeddings(model=OPENAI_EMBEDDING_MODEL, openai_api_key=OPENAI_KEY)
    # Using LangChain's Chroma wrapper:
    vectordb = Chroma(
        collection_name="documents",
        embedding_function=embedder,
        persist_directory="./back-end/chroma_data"
    )
    return vectordb

def build_conversational_chain():
    # LLM client (ChatOpenAI wrapper)
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1, openai_api_key=OPENAI_KEY)
    vectordb = init_vectorstore()

    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    # ConversationalRetrievalChain will:
    # 1) take query
    # 2) issue retrieval from vectordb
    # 3) pass retrieved docs + chat_history into LLM to generate answer
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectordb.as_retriever(search_type="dense", search_kwargs={"k": 4}),
        memory=memory,
        return_source_documents=True
    )
    return chain

def chat_loop():
    chain = build_conversational_chain()
    print("RAG chat ready. Type 'exit' to stop.")
    while True:
        q = input("\nYou: ").strip()
        if q.lower() in ("exit", "quit"):
            break
        resp = chain({"question": q})
        answer = resp["answer"]
        sources = resp.get("source_documents", [])
        print("\nAssistant:", answer)
        if sources:
            print("\nSources:")
            for s in sources:
                # langchain Document: s.page_content and s.metadata
                print(f"- {s.metadata.get('source', 'unknown')} (chunk {s.metadata.get('chunk', '?')})")

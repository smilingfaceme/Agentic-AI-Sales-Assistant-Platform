from langchain.memory import ConversationBufferMemory
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore
from langchain.chains import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.chains import LLMChain
from langchain_core.messages import HumanMessage, AIMessage
from sqlalchemy import create_engine, Column, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from langchain.chat_models import ChatOpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Pinecone
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, SystemMessage

from langchain_pinecone import PineconeVectorStore

import os

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_MODEL", "text-embedding-3-small")
PINECONE_KEY = os.getenv("PINECONE_API_KEY")

embed = OpenAIEmbeddings(model=OPENAI_EMBEDDING_MODEL)
pinecone_vectorstore = PineconeVectorStore(
    index_name=settings.PINECONE_INDEX_NAME,
    embedding=embed,
    text_key="text",
    pinecone_api_key=PINECONE_KEY,
)
# ---------- init Pinecone vectorstore wrapper for LangChain ----------
def init_vectorstore():
    # initialize pinecone client (needed by langchain's Pinecone wrapper)
    pinecone.init(api_key="")
    # create LangChain embeddings and vectorstore
    embedder = OpenAIEmbeddings(model=settings.OPENAI_EMBEDDING_MODEL, openai_api_key=settings.OPENAI_API_KEY)
    # Using LangChain's Pinecone wrapper:
    vectordb = Pinecone(
        index=pinecone.Index(settings.PINECONE_INDEX_NAME),
        embedding_function=embedder.embed_query,
        text_key="text",   # if storing raw text, ensure metadata includes 'text' or adjust retrieval
        namespace=settings.PINECONE_NAMESPACE
    )
    return vectordb

def build_conversational_chain():
    # LLM client (ChatOpenAI wrapper)
    llm = ChatOpenAI(model=settings.OPENAI_LLM_MODEL, temperature=0.1, openai_api_key=settings.OPENAI_API_KEY)
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

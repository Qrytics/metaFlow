from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = "dev"
    meta_api_key: str = ""
    meta_model_api_base: str = "https://api.meta.ai/v1"
    baseten_api_key: str = ""
    baseten_spark_open_model: str = "meta-models/muse-spark-open-1026"
    max_critic_retries: int = 3
    data_dir: str = "data"

    @property
    def is_dev(self) -> bool:
        return self.env == "dev"


settings = Settings()

import dotenv from "dotenv"

dotenv.config({path:['.env.dev','.env.prod']})

export const env = {
    get port(){
        return process.env.PORT || 3000
    },
    get dataBaseUrl(){
        return (process.env.DB_URL || process.env.DATABASEURL) as string
    },
    get userSignature(){
        return process.env.USER_SIGNATURE as string
    },
    get adminSignature(){
       return process.env.ADMIN_SIGNATURE as string
    },
    get refreshUserToken(){
       return process.env.REFRESH_USER_TOKEN as string
    },
    get RefreshAdminToken(){
       return process.env.REFRESH_ADMIN_TOKEN as string
    },
    get redisUrl(){
        return process.env.REDIS_URL as string
    },
    get saltRound (){
        return process.env.SALTROUND as string
    },
    get cloud_name(){
        return process.env.CLOUD_NAME as string
    },
    get api_key(){
        return (process.env.API_KEY || process.env.API_KET) as string
    },
    get api_secret(){
        return process.env.API_SECRET as string
    },
    get googleEmail(){
        return process.env.GOOGLE_ACCOUNT_EMAIL || process.env.GOOGLE_ACOUNCT_EMAIL
    },
    get googleAppPassword(){
        return process.env.GOOGLE_APP_PASSWORD
    },
    get serverUrl(){
        return process.env.SERVER_URL
    },
    get stripeSecretKey(){
        return process.env.STRIPE_SECRET_KEY
    },
    get stripeWebhookSecret(){
        return process.env.STRIPE_WEBHOOK_SECRET
    }
}

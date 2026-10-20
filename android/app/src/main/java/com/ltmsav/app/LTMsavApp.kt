package com.ltmsav.app

import android.app.Application
import com.ltmsav.app.data.local.LTMsavDatabase

class LTMsavApp : Application() {
    val database by lazy { LTMsavDatabase.getDatabase(this) }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: LTMsavApp
            private set
    }
}
